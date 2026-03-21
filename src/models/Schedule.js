const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Schedule = sequelize.define('Schedule', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  trainId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'trains',
      key: 'id',
    },
  },
  routeId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'routes',
      key: 'id',
    },
  },
  departureTime: {
    type: DataTypes.TIME,
    allowNull: false,
  },
  arrivalTime: {
    type: DataTypes.TIME,
    allowNull: false,
  },
  daysOfOperation: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: false,
    defaultValue: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    comment: 'Days of the week the schedule is active',
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
  },
  status: {
    type: DataTypes.ENUM('active', 'cancelled'),
    allowNull: false,
    defaultValue: 'active',
  },
}, {
  tableName: 'schedules',
  timestamps: true,
});

module.exports = Schedule;
