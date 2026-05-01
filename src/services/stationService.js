const stationRepository = require('../repositories/stationRepository');
const { publishDomainEvent } = require('../messaging/eventPublisher');

class StationService {
  async getAllStations() {
    return stationRepository.findAll();
  }

  async getStationById(id) {
    const station = await stationRepository.findById(id);
    if (!station) {
      throw Object.assign(new Error('Station not found'), { statusCode: 404 });
    }
    return station;
  }

  async createStation(data) {
    const { code, name, city, latitude, longitude } = data;

    if (!code || !name || !city) {
      throw Object.assign(new Error('Station code, name, and city are required'), { statusCode: 400 });
    }

    const existing = await stationRepository.findByCode(code.toUpperCase());
    if (existing) {
      throw Object.assign(new Error(`Station with code ${code} already exists`), { statusCode: 409 });
    }

    const station = await stationRepository.create({ code: code.toUpperCase(), name, city, latitude, longitude });

    try {
      await publishDomainEvent('station', 'created', station.toJSON());
    } catch (err) {
      console.error('Failed to publish station.created event:', err.message);
    }

    return station;
  }

  async updateStation(id, data) {
    if (data.code) {
      data.code = data.code.toUpperCase();
      const existing = await stationRepository.findByCode(data.code);
      if (existing && existing.id !== id) {
        throw Object.assign(new Error(`Station code ${data.code} is already in use`), { statusCode: 409 });
      }
    }

    const station = await stationRepository.update(id, data);
    if (!station) {
      throw Object.assign(new Error('Station not found'), { statusCode: 404 });
    }

    try {
      await publishDomainEvent('station', 'updated', station.toJSON());
    } catch (err) {
      console.error('Failed to publish station.updated event:', err.message);
    }

    return station;
  }

  async deleteStation(id) {
    const station = await stationRepository.delete(id);
    if (!station) {
      throw Object.assign(new Error('Station not found'), { statusCode: 404 });
    }

    try {
      await publishDomainEvent('station', 'deleted', station.toJSON());
    } catch (err) {
      console.error('Failed to publish station.deleted event:', err.message);
    }

    return station;
  }
}

module.exports = new StationService();
