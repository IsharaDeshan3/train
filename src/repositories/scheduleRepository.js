const { Op } = require('sequelize');
const { Schedule, Train, Route, Station } = require('../models');
const { redisClient } = require('../config/redis');

const CACHE_TTL = 300; // 5 minutes

class ScheduleRepository {
  async findAll() {
    return Schedule.findAll({
      include: [
        { model: Train, attributes: ['id', 'trainNumber', 'name', 'type', 'totalSeats', 'status'] },
        {
          model: Route,
          attributes: ['id', 'routeName', 'distance'],
          include: [
            { model: Station, as: 'originStation', attributes: ['id', 'code', 'name', 'city'] },
            { model: Station, as: 'destinationStation', attributes: ['id', 'code', 'name', 'city'] },
          ],
        },
      ],
      order: [['departureTime', 'ASC']],
    });
  }

  async findById(id) {
    return Schedule.findByPk(id, {
      include: [
        { model: Train, attributes: ['id', 'trainNumber', 'name', 'type', 'totalSeats', 'status'] },
        {
          model: Route,
          attributes: ['id', 'routeName', 'distance'],
          include: [
            { model: Station, as: 'originStation', attributes: ['id', 'code', 'name', 'city'] },
            { model: Station, as: 'destinationStation', attributes: ['id', 'code', 'name', 'city'] },
          ],
        },
      ],
    });
  }

  async create(data) {
    return Schedule.create(data);
  }

  async update(id, data) {
    const schedule = await Schedule.findByPk(id);
    if (!schedule) return null;
    return schedule.update(data);
  }

  async delete(id) {
    const schedule = await Schedule.findByPk(id);
    if (!schedule) return null;
    await schedule.destroy();
    return schedule;
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
      const originStation = await Station.findOne({ where: { code: origin.toUpperCase() } });
      if (originStation) routeWhere.originStationId = originStation.id;
    }
    if (destination) {
      const destStation = await Station.findOne({ where: { code: destination.toUpperCase() } });
      if (destStation) routeWhere.destinationStationId = destStation.id;
    }

    // Filter by day of operation if date is provided
    if (date) {
      const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });
      whereConditions.daysOfOperation = { [Op.contains]: [dayOfWeek] };
    }

    const results = await Schedule.findAll({
      where: whereConditions,
      include: [
        { model: Train, attributes: ['id', 'trainNumber', 'name', 'type', 'totalSeats', 'status'] },
        {
          model: Route,
          where: Object.keys(routeWhere).length > 0 ? routeWhere : undefined,
          attributes: ['id', 'routeName', 'distance'],
          include: [
            { model: Station, as: 'originStation', attributes: ['id', 'code', 'name', 'city'] },
            { model: Station, as: 'destinationStation', attributes: ['id', 'code', 'name', 'city'] },
          ],
        },
      ],
      order: [['departureTime', 'ASC']],
    });

    // Cache the results
    try {
      if (redisClient.isOpen) {
        await redisClient.setEx(cacheKey, CACHE_TTL, JSON.stringify(results));
        console.log('💾 Cached results for:', cacheKey);
      }
    } catch (err) {
      console.error('Redis write error:', err.message);
    }

    return results;
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
