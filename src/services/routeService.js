const routeRepository = require('../repositories/routeRepository');
const stationRepository = require('../repositories/stationRepository');
const { publishDomainEvent } = require('../messaging/eventPublisher');

class RouteService {
  async getAllRoutes() {
    return routeRepository.findAll();
  }

  async getRouteById(id) {
    const route = await routeRepository.findById(id);
    if (!route) {
      throw Object.assign(new Error('Route not found'), { statusCode: 404 });
    }
    return route;
  }

  async createRoute(data) {
    const { routeName, originStationId, destinationStationId, distance } = data;

    if (!routeName || !originStationId || !destinationStationId) {
      throw Object.assign(new Error('Route name, origin station, and destination station are required'), { statusCode: 400 });
    }

    if (originStationId.toString() === destinationStationId.toString()) {
      throw Object.assign(new Error('Origin and destination stations must be different'), { statusCode: 400 });
    }

    // Validate stations exist
    const origin = await stationRepository.findById(originStationId);
    if (!origin) {
      throw Object.assign(new Error('Origin station not found'), { statusCode: 404 });
    }

    const destination = await stationRepository.findById(destinationStationId);
    if (!destination) {
      throw Object.assign(new Error('Destination station not found'), { statusCode: 404 });
    }

    const route = await routeRepository.create({ routeName, originStationId, destinationStationId, distance });

    try {
      await publishDomainEvent('route', 'created', route.toJSON());
    } catch (err) {
      console.error('Failed to publish route.created event:', err.message);
    }

    return route;
  }

  async updateRoute(id, data) {
    if (
      data.originStationId
      && data.destinationStationId
      && data.originStationId.toString() === data.destinationStationId.toString()
    ) {
      throw Object.assign(new Error('Origin and destination stations must be different'), { statusCode: 400 });
    }

    const route = await routeRepository.update(id, data);
    if (!route) {
      throw Object.assign(new Error('Route not found'), { statusCode: 404 });
    }

    try {
      await publishDomainEvent('route', 'updated', route.toJSON());
    } catch (err) {
      console.error('Failed to publish route.updated event:', err.message);
    }

    return route;
  }

  async deleteRoute(id) {
    const route = await routeRepository.delete(id);
    if (!route) {
      throw Object.assign(new Error('Route not found'), { statusCode: 404 });
    }

    try {
      await publishDomainEvent('route', 'deleted', route.toJSON());
    } catch (err) {
      console.error('Failed to publish route.deleted event:', err.message);
    }

    return route;
  }
}

module.exports = new RouteService();
