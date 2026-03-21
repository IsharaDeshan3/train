const { Train } = require('../models');

class TrainRepository {
  async findAll() {
    return Train.findAll({ order: [['trainNumber', 'ASC']] });
  }

  async findById(id) {
    return Train.findByPk(id);
  }

  async findByTrainNumber(trainNumber) {
    return Train.findOne({ where: { trainNumber } });
  }

  async create(data) {
    return Train.create(data);
  }

  async update(id, data) {
    const train = await Train.findByPk(id);
    if (!train) return null;
    return train.update(data);
  }

  async delete(id) {
    const train = await Train.findByPk(id);
    if (!train) return null;
    await train.destroy();
    return train;
  }
}

module.exports = new TrainRepository();
