const trainRepository = require('../repositories/trainRepository');
const { publishDomainEvent } = require('../messaging/eventPublisher');

class TrainService {
  async getAllTrains() {
    return trainRepository.findAll();
  }

  async getTrainById(id) {
    const train = await trainRepository.findById(id);
    if (!train) {
      throw Object.assign(new Error('Train not found'), { statusCode: 404 });
    }
    return train;
  }

  async createTrain(data) {
    const { trainNumber, name, type, totalSeats, status } = data;

    if (!trainNumber || !name) {
      throw Object.assign(new Error('Train number and name are required'), { statusCode: 400 });
    }

    const existing = await trainRepository.findByTrainNumber(trainNumber);
    if (existing) {
      throw Object.assign(new Error(`Train with number ${trainNumber} already exists`), { statusCode: 409 });
    }

    const train = await trainRepository.create({ trainNumber, name, type, totalSeats, status });

    try {
      await publishDomainEvent('train', 'created', train.toJSON());
    } catch (err) {
      console.error('Failed to publish train.created event:', err.message);
    }

    return train;
  }

  async updateTrain(id, data) {
    if (data.trainNumber) {
      const existing = await trainRepository.findByTrainNumber(data.trainNumber);
      if (existing && existing.id !== id) {
        throw Object.assign(new Error(`Train number ${data.trainNumber} is already in use`), { statusCode: 409 });
      }
    }

    const train = await trainRepository.update(id, data);
    if (!train) {
      throw Object.assign(new Error('Train not found'), { statusCode: 404 });
    }

    try {
      await publishDomainEvent('train', 'updated', train.toJSON());
    } catch (err) {
      console.error('Failed to publish train.updated event:', err.message);
    }

    return train;
  }

  async deleteTrain(id) {
    const train = await trainRepository.delete(id);
    if (!train) {
      throw Object.assign(new Error('Train not found'), { statusCode: 404 });
    }

    try {
      await publishDomainEvent('train', 'deleted', train.toJSON());
    } catch (err) {
      console.error('Failed to publish train.deleted event:', err.message);
    }

    return train;
  }
}

module.exports = new TrainService();
