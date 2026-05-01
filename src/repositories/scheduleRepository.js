const { Schedule, Train, Route, Station } = require('../models');
const { redisClient } = require('../config/redis');

const CACHE_TTL = 300; // 5 minutes

const populateScheduleQuery = (query) => query
  .populate({ path: 'trainId', model: Train, select: 'trainNumber name type totalSeats status' })
  .populate({
    path: 'routeId',
    model: Route,
    select: 'routeName distance originStationId destinationStationId',
    populate: [
      { path: 'originStationId', model: Station, select: 'code name city' },
      { path: 'destinationStationId', model: Station, select: 'code name city' },
    ],
  });

const mapRouteForResponse = (routeDoc) => {
  if (!routeDoc) return null;
  const route = routeDoc.toJSON();
  const originStation = route.originStationId && typeof route.originStationId === 'object'
    ? route.originStationId
    : null;
  const destinationStation = route.destinationStationId && typeof route.destinationStationId === 'object'
    ? route.destinationStationId
    : null;

  return {
    ...route,
    originStationId: originStation?.id || route.originStationId,
    destinationStationId: destinationStation?.id || route.destinationStationId,
    originStation,
    destinationStation,
  };
};

const mapScheduleForResponse = (scheduleDoc) => {
  const schedule = scheduleDoc.toJSON();
  const train = schedule.trainId && typeof schedule.trainId === 'object' ? schedule.trainId : null;
  const route = schedule.routeId && typeof schedule.routeId === 'object' ? schedule.routeId : null;

  return {
    ...schedule,
    trainId: train?.id || schedule.trainId,
    routeId: route?.id || schedule.routeId,
    Train: train,
    Route: route ? mapRouteForResponse(routeDocFromObject(route)) : null,
  };
};

const routeDocFromObject = (route) => ({
  toJSON: () => route,
});

class ScheduleRepository {
  async findAll() {
    const schedules = await populateScheduleQuery(Schedule.find().sort({ departureTime: 1 }));
    return schedules.map(mapScheduleForResponse);
  }

  async findById(id) {
    try {
      const schedule = await populateScheduleQuery(Schedule.findById(id));
      return schedule ? mapScheduleForResponse(schedule) : null;
    } catch (_) {
      return null;
    }
  }

  async create(data) {
    return Schedule.create(data);
  }

  async update(id, data) {
    try {
      return await Schedule.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    } catch (_) {
      return null;
    }
  }

  async delete(id) {
    try {
      return await Schedule.findByIdAndDelete(id);
    } catch (_) {
      return null;
    }
  }

  async searchSchedules(origin, destination, date) {
    const cacheKey = `schedules:${origin}:${destination}:${date || 'all'}`;

    // Try fetching from Redis cache
    try {
      if (redisClient.isOpen) {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
          console.log('📦 Cache hit for:', cacheKey);
          return JSON.parse(cached);
        }
      }
    } catch (err) {
      console.error('Redis read error:', err.message);
    }

    // Build query conditions
    const whereConditions = { status: 'active' };
    const routeWhere = {};

    if (origin) {
      const originStation = await Station.findOne({ code: origin.toUpperCase() });
      if (originStation) routeWhere.originStationId = originStation._id;
    }
    if (destination) {
      const destStation = await Station.findOne({ code: destination.toUpperCase() });
      if (destStation) routeWhere.destinationStationId = destStation._id;
    }

    // Filter by day of operation if date is provided.
    // daysOfOperation is an array field, so we use $in for containment matching.
    if (date) {
      const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });
      whereConditions.daysOfOperation = { $in: [dayOfWeek] };
    }

    const matchedRouteIds = Object.keys(routeWhere).length > 0
      ? (await Route.find(routeWhere).select('_id')).map((route) => route._id)
      : null;

    if (matchedRouteIds && matchedRouteIds.length === 0) {
      return [];
    }

    const scheduleFilter = {
      ...whereConditions,
      ...(matchedRouteIds ? { routeId: { $in: matchedRouteIds } } : {}),
    };

    const results = await populateScheduleQuery(
      Schedule.find(scheduleFilter).sort({ departureTime: 1 })
    );

    const mappedResults = results.map(mapScheduleForResponse);

    // Cache the results
    try {
      if (redisClient.isOpen) {
        await redisClient.setEx(cacheKey, CACHE_TTL, JSON.stringify(mappedResults));
        console.log('💾 Cached results for:', cacheKey);
      }
    } catch (err) {
      console.error('Redis write error:', err.message);
    }

    return mappedResults;
  }

  async invalidateCache() {
    try {
      if (redisClient.isOpen) {
        const keys = await redisClient.keys('schedules:*');
        if (keys.length > 0) {
          await redisClient.del(keys);
          console.log('🗑️ Invalidated schedule cache');
        }
      }
    } catch (err) {
      console.error('Redis cache invalidation error:', err.message);
    }
  }
}

module.exports = new ScheduleRepository();
