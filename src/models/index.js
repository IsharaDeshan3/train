const sequelize = require('../config/database');
const Train = require('./Train');
const Station = require('./Station');
const Route = require('./Route');
const Schedule = require('./Schedule');

// ─── Associations ───────────────────────────────────────────────

// Route belongs to origin and destination stations
Route.belongsTo(Station, { as: 'originStation', foreignKey: 'originStationId' });
Route.belongsTo(Station, { as: 'destinationStation', foreignKey: 'destinationStationId' });

Station.hasMany(Route, { as: 'originRoutes', foreignKey: 'originStationId' });
Station.hasMany(Route, { as: 'destinationRoutes', foreignKey: 'destinationStationId' });

// Schedule belongs to Train and Route
Schedule.belongsTo(Train, { foreignKey: 'trainId' });
Schedule.belongsTo(Route, { foreignKey: 'routeId' });

Train.hasMany(Schedule, { foreignKey: 'trainId' });
Route.hasMany(Schedule, { foreignKey: 'routeId' });

module.exports = {
  sequelize,
  Train,
  Station,
  Route,
  Schedule,
};
