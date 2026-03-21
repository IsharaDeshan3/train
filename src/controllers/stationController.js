const stationService = require('../services/stationService');

/**
 * @swagger
 * components:
 *   schemas:
 *     Station:
 *       type: object
 *       required:
 *         - code
 *         - name
 *         - city
 *       properties:
 *         id:
 *           type: integer
 *         code:
 *           type: string
 *           example: "CMB"
 *         name:
 *           type: string
 *           example: "Colombo Fort"
 *         city:
 *           type: string
 *           example: "Colombo"
 *         latitude:
 *           type: number
 *           example: 6.9344
 *         longitude:
 *           type: number
 *           example: 79.8428
 */

/**
 * @swagger
 * /api/stations:
 *   get:
 *     summary: Get all stations
 *     tags: [Stations]
 *     responses:
 *       200:
 *         description: List of all stations
 */
const getAllStations = async (req, res, next) => {
  try {
    const stations = await stationService.getAllStations();
    res.json({ success: true, data: stations });
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /api/stations/{id}:
 *   get:
 *     summary: Get station by ID
 *     tags: [Stations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Station details
 *       404:
 *         description: Station not found
 */
const getStationById = async (req, res, next) => {
  try {
    const station = await stationService.getStationById(req.params.id);
    res.json({ success: true, data: station });
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /api/stations:
 *   post:
 *     summary: Create a new station
 *     tags: [Stations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Station'
 *     responses:
 *       201:
 *         description: Station created successfully
 */
const createStation = async (req, res, next) => {
  try {
    const station = await stationService.createStation(req.body);
    res.status(201).json({ success: true, data: station });
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /api/stations/{id}:
 *   put:
 *     summary: Update a station
 *     tags: [Stations]
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
 *             $ref: '#/components/schemas/Station'
 *     responses:
 *       200:
 *         description: Station updated successfully
 */
const updateStation = async (req, res, next) => {
  try {
    const station = await stationService.updateStation(req.params.id, req.body);
    res.json({ success: true, data: station });
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /api/stations/{id}:
 *   delete:
 *     summary: Delete a station
 *     tags: [Stations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Station deleted successfully
 */
const deleteStation = async (req, res, next) => {
  try {
    const station = await stationService.deleteStation(req.params.id);
    res.json({ success: true, message: 'Station deleted successfully', data: station });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAllStations, getStationById, createStation, updateStation, deleteStation };
