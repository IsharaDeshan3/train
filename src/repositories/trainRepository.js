const { Train } = require('../models');

class TrainRepository {
  async findAll() {
    return Train.find().sort({ trainNumber: 1 });
  }

  async findById(id) {
    try {
      return await Train.findById(id);
    } catch (_) {
      return null;
    }
  }

  async findByTrainNumber(trainNumber) {
    return Train.findOne({ trainNumber });
  }

  async create(data) {
    return Train.create(data);
  }

  async update(id, data) {
    try {
      return await Train.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    } catch (_) {
      return null;
    }
  }

  async delete(id) {
    try {
      return await Train.findByIdAndDelete(id);
    } catch (_) {
      return null;
    }
  }
}

module.exports = new TrainRepository();
