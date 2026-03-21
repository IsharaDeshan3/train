const scheduleService = require('../services/scheduleService');

/**
 * @swagger
 * components:
 *   schemas:
 *     Schedule:
 *       type: object
 *       required:
 *         - trainId
 *         - routeId
 *         - departureTime
 *         - arrivalTime
 *       properties:
 *         id:
 *           type: integer
 *         trainId:
 *           type: integer
 *           example: 1
 *         routeId:
 *           type: integer
 *           example: 1
 *         departureTime:
 *           type: string
 *           example: "06:30:00"
 *         arrivalTime:
 *           type: string
 *           example: "09:45:00"
 *         daysOfOperation:
 *           type: array
 *           items:
 *             type: string
 *           example: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
 *         price:
 *           type: number
 *           example: 450.00
 *         status:
 *           type: string
 *           enum: [active, cancelled]
 *           example: "active"
 */

/**
 * @swagger
 * /api/schedules:
 *   get:
 *     summary: Get all schedules
 *     tags: [Schedules]
 *     responses:
 *       200:
 *         description: List of all schedules
 */
const getAllSchedules = async (req, res, next) => {
  try {
    const schedules = await scheduleService.getAllSchedules();
    res.json({ success: true, data: schedules });
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /api/schedules/{id}:
 *   get:
 *     summary: Get schedule by ID
 *     tags: [Schedules]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Schedule details
 *       404:
 *         description: Schedule not found
 */
const getScheduleById = async (req, res, next) => {
  try {
    const schedule = await scheduleService.getScheduleById(req.params.id);
    res.json({ success: true, data: schedule });
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /api/schedules:
 *   post:
 *     summary: Create a new schedule
 *     tags: [Schedules]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Schedule'
 *     responses:
 *       201:
 *         description: Schedule created successfully
 */
const createSchedule = async (req, res, next) => {
  try {
    const schedule = await scheduleService.createSchedule(req.body);
    res.status(201).json({ success: true, data: schedule });
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /api/schedules/{id}:
 *   put:
 *     summary: Update a schedule
 *     tags: [Schedules]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Schedule'
 *     responses:
 *       200:
 *         description: Schedule updated successfully
 */
const updateSchedule = async (req, res, next) => {
  try {
    const schedule = await scheduleService.updateSchedule(req.params.id, req.body);
    res.json({ success: true, data: schedule });
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /api/schedules/{id}:
 *   delete:
 *     summary: Delete a schedule
 *     tags: [Schedules]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Schedule deleted successfully
 */
const deleteSchedule = async (req, res, next) => {
  try {
    const schedule = await scheduleService.deleteSchedule(req.params.id);
    res.json({ success: true, message: 'Schedule deleted successfully', data: schedule });
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /schedules/search:
 *   get:
 *     summary: Search schedules (Integration endpoint for Ticket Service)
 *     tags: [Schedules]
 *     parameters:
 *       - in: query
 *         name: origin
 *         schema:
 *           type: string
 *         description: Origin station code (e.g., CMB)
 *         example: "CMB"
 *       - in: query
 *         name: destination
 *         schema:
 *           type: string
 *         description: Destination station code (e.g., KDY)
 *         example: "KDY"
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Date to search (e.g., 2026-03-25)
 *         example: "2026-03-25"
 *     responses:
 *       200:
 *         description: Matching schedules with train and route info
 */
const searchSchedules = async (req, res, next) => {
  try {
    const { origin, destination, date } = req.query;
    const schedules = await scheduleService.searchSchedules(origin, destination, date);
    res.json({ success: true, data: schedules, count: schedules.length });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllSchedules,
  getScheduleById,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  searchSchedules,
};
