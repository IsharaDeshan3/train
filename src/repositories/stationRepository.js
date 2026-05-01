const { Station } = require('../models');

class StationRepository {
  async findAll() {
    return Station.find().sort({ code: 1 });
  }

  async findById(id) {
    try {
      return await Station.findById(id);
    } catch (_) {
      return null;
    }
  }

  async findByCode(code) {
    return Station.findOne({ code });
  }

  async create(data) {
    return Station.create(data);
  }

  async update(id, data) {
    try {
      return await Station.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    } catch (_) {
      return null;
    }
  }

  async delete(id) {
    try {
      return await Station.findByIdAndDelete(id);
    } catch (_) {
      return null;
    }
  }
}

module.exports = new StationRepository();
