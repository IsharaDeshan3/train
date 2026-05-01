const { Route, Station } = require('../models');

const mapRoute = (route) => {
  const item = route.toJSON();
  const originStation = item.originStationId && typeof item.originStationId === 'object'
    ? item.originStationId
    : null;
  const destinationStation = item.destinationStationId && typeof item.destinationStationId === 'object'
    ? item.destinationStationId
    : null;

  return {
    ...item,
    originStationId: originStation?.id || item.originStationId,
    destinationStationId: destinationStation?.id || item.destinationStationId,
    originStation,
    destinationStation,
  };
};

class RouteRepository {
  async findAll() {
    const routes = await Route.find()
      .sort({ routeName: 1 })
      .populate({ path: 'originStationId', model: Station, select: 'code name city' })
      .populate({ path: 'destinationStationId', model: Station, select: 'code name city' });

    return routes.map(mapRoute);
  }

  async findById(id) {
    try {
      const route = await Route.findById(id)
        .populate({ path: 'originStationId', model: Station, select: 'code name city' })
        .populate({ path: 'destinationStationId', model: Station, select: 'code name city' });

      return route ? mapRoute(route) : null;
    } catch (_) {
      return null;
    }
  }

  async create(data) {
    return Route.create(data);
  }

  async update(id, data) {
    try {
      return await Route.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    } catch (_) {
      return null;
    }
  }

  async delete(id) {
    try {
      return await Route.findByIdAndDelete(id);
    } catch (_) {
      return null;
    }
  }
}

module.exports = new RouteRepository();
