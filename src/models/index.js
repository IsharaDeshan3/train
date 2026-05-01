const { mongoose } = require('../config/database');
const Train = require('./Train');
const Station = require('./Station');
const Route = require('./Route');
const Schedule = require('./Schedule');

module.exports = {
  mongoose,
  Train,
  Station,
  Route,
  Schedule,
};
