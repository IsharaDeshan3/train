const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Train Management Service API',
      version: '1.0.0',
      description: 'REST API for managing trains, stations, routes, and schedules for the Sri Lankan Railway System',
      contact: {
        name: 'CTSE Team',
      },
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 4000}`,
        description: 'Development server',
      },
    ],
    tags: [
      { name: 'Trains', description: 'Train management endpoints' },
      { name: 'Stations', description: 'Station management endpoints' },
      { name: 'Routes', description: 'Route management endpoints' },
      { name: 'Schedules', description: 'Schedule management and search endpoints' },
    ],
  },
  apis: ['./src/controllers/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
