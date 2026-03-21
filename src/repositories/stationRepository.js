const { Station } = require('../models');

class StationRepository {
  async findAll() {
    return Station.findAll({ order: [['code', 'ASC']] });
  }

  async findById(id) {
    return Station.findByPk(id);
  }

  async findByCode(code) {
    return Station.findOne({ where: { code } });
  }

  async create(data) {
    return Station.create(data);
  }

  async update(id, data) {
    const station = await Station.findByPk(id);
    if (!station) return null;
    return station.update(data);
  }

  async delete(id) {
    const station = await Station.findByPk(id);
    if (!station) return null;
    await station.destroy();
    return station;
  }
}

module.exports = new StationRepository();
