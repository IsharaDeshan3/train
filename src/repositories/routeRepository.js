const { Route, Station } = require('../models');

class RouteRepository {
  async findAll() {
    return Route.findAll({
      include: [
        { model: Station, as: 'originStation', attributes: ['id', 'code', 'name', 'city'] },
        { model: Station, as: 'destinationStation', attributes: ['id', 'code', 'name', 'city'] },
      ],
      order: [['routeName', 'ASC']],
    });
  }

  async findById(id) {
    return Route.findByPk(id, {
      include: [
        { model: Station, as: 'originStation', attributes: ['id', 'code', 'name', 'city'] },
        { model: Station, as: 'destinationStation', attributes: ['id', 'code', 'name', 'city'] },
      ],
    });
  }

  async create(data) {
    return Route.create(data);
  }

  async update(id, data) {
    const route = await Route.findByPk(id);
    if (!route) return null;
    return route.update(data);
  }

  async delete(id) {
    const route = await Route.findByPk(id);
    if (!route) return null;
    await route.destroy();
    return route;
  }
}

module.exports = new RouteRepository();
