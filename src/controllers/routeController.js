const routeService = require('../services/routeService');

/**
 * @swagger
 * components:
 *   schemas:
 *     Route:
 *       type: object
 *       required:
 *         - routeName
 *         - originStationId
 *         - destinationStationId
 *       properties:
 *         id:
 *           type: integer
 *         routeName:
 *           type: string
 *           example: "Colombo - Kandy"
 *         originStationId:
 *           type: integer
 *           example: 1
 *         destinationStationId:
 *           type: integer
 *           example: 2
 *         distance:
 *           type: number
 *           example: 115.5
 */

/**
 * @swagger
 * /api/routes:
 *   get:
 *     summary: Get all routes
 *     tags: [Routes]
 *     responses:
 *       200:
 *         description: List of all routes
 */
const getAllRoutes = async (req, res, next) => {
  try {
    const routes = await routeService.getAllRoutes();
    res.json({ success: true, data: routes });
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /api/routes/{id}:
 *   get:
 *     summary: Get route by ID
 *     tags: [Routes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Route details
 *       404:
 *         description: Route not found
 */
const getRouteById = async (req, res, next) => {
  try {
    const route = await routeService.getRouteById(req.params.id);
    res.json({ success: true, data: route });
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /api/routes:
 *   post:
 *     summary: Create a new route
 *     tags: [Routes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Route'
 *     responses:
 *       201:
 *         description: Route created successfully
 */
const createRoute = async (req, res, next) => {
  try {
    const route = await routeService.createRoute(req.body);
    res.status(201).json({ success: true, data: route });
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /api/routes/{id}:
 *   put:
 *     summary: Update a route
 *     tags: [Routes]
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
 *             $ref: '#/components/schemas/Route'
 *     responses:
 *       200:
 *         description: Route updated successfully
 */
const updateRoute = async (req, res, next) => {
  try {
    const route = await routeService.updateRoute(req.params.id, req.body);
    res.json({ success: true, data: route });
  } catch (err) {
    next(err);
  }
};

/**
 * @swagger
 * /api/routes/{id}:
 *   delete:
 *     summary: Delete a route
 *     tags: [Routes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Route deleted successfully
 */
const deleteRoute = async (req, res, next) => {
  try {
    const route = await routeService.deleteRoute(req.params.id);
    res.json({ success: true, message: 'Route deleted successfully', data: route });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAllRoutes, getRouteById, createRoute, updateRoute, deleteRoute };
