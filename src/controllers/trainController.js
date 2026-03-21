const trainService = require('../services/trainService');

/**
 * @swagger
 * components:
 *   schemas:
 *     Train:
 *       type: object
 *       required:
 *         - trainNumber
 *         - name
 *       properties:
 *         id:
 *           type: integer
 *         trainNumber:
 *           type: string
 *           example: "T001"
 *         name:
 *           type: string
 *           example: "Udarata Menike"
 *         type:
 *           type: string
 *           enum: [express, local, intercity]
 *           example: "intercity"
 *         totalSeats:
 *           type: integer
 *           example: 200
 *         status:
 *           type: string
 *           enum: [active, inactive, maintenance]
 *           example: "active"
 */

/**
 * @swagger
 * /api/trains:
 *   get:
 *     summary: Get all trains
 *     tags: [Trains]
 *     responses:
 *       200:
 *         description: List of all trains
 */
const getAllTrains = async (req, res, next) => {
  try {
    const trains = await trainService.getAllTrains();
    res.json({ success: true, data: trains });
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /api/trains/{id}:
 *   get:
 *     summary: Get train by ID
 *     tags: [Trains]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Train details
 *       404:
 *         description: Train not found
 */
const getTrainById = async (req, res, next) => {
  try {
    const train = await trainService.getTrainById(req.params.id);
    res.json({ success: true, data: train });
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /api/trains:
 *   post:
 *     summary: Create a new train
 *     tags: [Trains]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Train'
 *     responses:
 *       201:
 *         description: Train created successfully
 */
const createTrain = async (req, res, next) => {
  try {
    const train = await trainService.createTrain(req.body);
    res.status(201).json({ success: true, data: train });
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /api/trains/{id}:
 *   put:
 *     summary: Update a train
 *     tags: [Trains]
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
 *             $ref: '#/components/schemas/Train'
 *     responses:
 *       200:
 *         description: Train updated successfully
 */
const updateTrain = async (req, res, next) => {
  try {
    const train = await trainService.updateTrain(req.params.id, req.body);
    res.json({ success: true, data: train });
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /api/trains/{id}:
 *   delete:
 *     summary: Delete a train
 *     tags: [Trains]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Train deleted successfully
 */
const deleteTrain = async (req, res, next) => {
  try {
    const train = await trainService.deleteTrain(req.params.id);
    res.json({ success: true, message: 'Train deleted successfully', data: train });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAllTrains, getTrainById, createTrain, updateTrain, deleteTrain };
