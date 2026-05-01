const scheduleRepository = require('../repositories/scheduleRepository');
const trainRepository = require('../repositories/trainRepository');
const routeRepository = require('../repositories/routeRepository');
const { publishDomainEvent } = require('../messaging/eventPublisher');

class ScheduleService {
  async getAllSchedules() {
    return scheduleRepository.findAll();
  }

  async getScheduleById(id) {
    const schedule = await scheduleRepository.findById(id);
    if (!schedule) {
      throw Object.assign(new Error('Schedule not found'), { statusCode: 404 });
    }
    return schedule;
  }

  async createSchedule(data) {
    const { trainId, routeId, departureTime, arrivalTime, daysOfOperation, price, status } = data;

    if (!trainId || !routeId || !departureTime || !arrivalTime) {
      throw Object.assign(new Error('Train ID, route ID, departure time, and arrival time are required'), { statusCode: 400 });
    }

    // Validate train exists
    const train = await trainRepository.findById(trainId);
    if (!train) {
      throw Object.assign(new Error('Train not found'), { statusCode: 404 });
    }

    // Validate route exists
    const route = await routeRepository.findById(routeId);
    if (!route) {
      throw Object.assign(new Error('Route not found'), { statusCode: 404 });
    }

    const schedule = await scheduleRepository.create({
      trainId, routeId, departureTime, arrivalTime, daysOfOperation, price, status,
    });

    try {
      await publishDomainEvent('schedule', 'created', schedule.toJSON());
    } catch (err) {
      console.error('Failed to publish schedule.created event:', err.message);
    }

    // Invalidate cache when new schedule is created
    await scheduleRepository.invalidateCache();

    return schedule;
  }

  async updateSchedule(id, data) {
    const schedule = await scheduleRepository.update(id, data);
    if (!schedule) {
      throw Object.assign(new Error('Schedule not found'), { statusCode: 404 });
    }

    try {
      await publishDomainEvent('schedule', 'updated', schedule.toJSON());
    } catch (err) {
      console.error('Failed to publish schedule.updated event:', err.message);
    }

    // Invalidate cache when schedule is updated
    await scheduleRepository.invalidateCache();

    return schedule;
  }

  async deleteSchedule(id) {
    const schedule = await scheduleRepository.delete(id);
    if (!schedule) {
      throw Object.assign(new Error('Schedule not found'), { statusCode: 404 });
    }

    try {
      await publishDomainEvent('schedule', 'deleted', schedule.toJSON());
    } catch (err) {
      console.error('Failed to publish schedule.deleted event:', err.message);
    }

    // Invalidate cache when schedule is deleted
    await scheduleRepository.invalidateCache();

    return schedule;
  }

  async searchSchedules(origin, destination, date) {
    return scheduleRepository.searchSchedules(origin, destination, date);
  }
}

module.exports = new ScheduleService();
