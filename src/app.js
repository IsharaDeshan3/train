const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');
const errorHandler = require('./middleware/errorHandler');

// Import routes
const trainRoutes = require('./routes/trainRoutes');
const stationRoutes = require('./routes/stationRoutes');
const routeRoutes = require('./routes/routeRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');
const { searchSchedules } = require('./controllers/scheduleController');

const app = express();

// ─── Middleware ───────────────────────────────────────────────
const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*';
app.use(cors({ origin: allowedOrigins }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// ─── Swagger Docs ────────────────────────────────────────────
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Train Management Service API Docs',
}));

// ─── API Routes ──────────────────────────────────────────────
const { apiKeyAuth } = require('./middleware/auth');
app.use('/api', apiKeyAuth);
app.use('/api/trains', trainRoutes);
app.use('/api/stations', stationRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/schedules', scheduleRoutes);

// ─── Integration Endpoint ───────────────────────────────────
app.get('/schedules/search', apiKeyAuth, searchSchedules);

// ─── Health Check ────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'UP',
    service: 'train-management-service',
    timestamp: new Date().toISOString(),
  });
});

// ─── 404 Handler ─────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: { message: `Route ${req.originalUrl} not found` },
  });
});

// ─── Error Handler ───────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
