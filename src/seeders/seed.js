require('dotenv').config();
const { connectDatabase, mongoose } = require('../config/database');
const { Train, Station, Route, Schedule } = require('../models');

const seed = async () => {
  try {
    await connectDatabase();
    console.log('✅ MongoDB connected');

    // Reset collections
    await Promise.all([
      Schedule.deleteMany({}),
      Route.deleteMany({}),
      Train.deleteMany({}),
      Station.deleteMany({}),
    ]);
    console.log('✅ Collections reset');

    // ─── Stations (Sri Lankan Railway Stations) ─────────────
    const stations = await Station.insertMany([
      { code: 'CMB', name: 'Colombo Fort', city: 'Colombo', latitude: 6.9344, longitude: 79.8428 },
      { code: 'MDA', name: 'Maradana', city: 'Colombo', latitude: 6.9289, longitude: 79.8650 },
      { code: 'KDY', name: 'Kandy', city: 'Kandy', latitude: 7.2906, longitude: 80.6337 },
      { code: 'GLQ', name: 'Galle', city: 'Galle', latitude: 6.0328, longitude: 80.2170 },
      { code: 'MTR', name: 'Matara', city: 'Matara', latitude: 5.9549, longitude: 80.5350 },
      { code: 'JFN', name: 'Jaffna', city: 'Jaffna', latitude: 9.6615, longitude: 80.0255 },
      { code: 'ANP', name: 'Anuradhapura', city: 'Anuradhapura', latitude: 8.3114, longitude: 80.4037 },
      { code: 'BDL', name: 'Badulla', city: 'Badulla', latitude: 6.9934, longitude: 81.0550 },
      { code: 'PLN', name: 'Polonnaruwa', city: 'Polonnaruwa', latitude: 7.9403, longitude: 81.0188 },
      { code: 'TRC', name: 'Trincomalee', city: 'Trincomalee', latitude: 8.5874, longitude: 81.2152 },
    ]);
    console.log(`✅ Seeded ${stations.length} stations`);

    // ─── Trains ─────────────────────────────────────────────
    const trains = await Train.insertMany([
      { trainNumber: 'T1001', name: 'Udarata Menike', type: 'intercity', totalSeats: 300, status: 'active' },
      { trainNumber: 'T1002', name: 'Podi Menike', type: 'intercity', totalSeats: 280, status: 'active' },
      { trainNumber: 'T1003', name: 'Ruhunu Kumari', type: 'express', totalSeats: 350, status: 'active' },
      { trainNumber: 'T1004', name: 'Galu Kumari', type: 'express', totalSeats: 250, status: 'active' },
      { trainNumber: 'T1005', name: 'Rajarata Rajini', type: 'intercity', totalSeats: 300, status: 'active' },
      { trainNumber: 'T1006', name: 'Yal Devi', type: 'intercity', totalSeats: 320, status: 'active' },
      { trainNumber: 'T1007', name: 'Uttara Devi', type: 'express', totalSeats: 200, status: 'active' },
      { trainNumber: 'T1008', name: 'Colombo Commuter', type: 'local', totalSeats: 400, status: 'active' },
      { trainNumber: 'T1009', name: 'Badulla Night Mail', type: 'express', totalSeats: 250, status: 'active' },
      { trainNumber: 'T1010', name: 'Trincomalee Express', type: 'express', totalSeats: 220, status: 'maintenance' },
    ]);
    console.log(`✅ Seeded ${trains.length} trains`);

    // ─── Routes ──────────────────────────────────────────────
    const routes = await Route.insertMany([
      { routeName: 'Colombo - Kandy', originStationId: stations[0]._id, destinationStationId: stations[2]._id, distance: 115.0 },
      { routeName: 'Colombo - Galle', originStationId: stations[0]._id, destinationStationId: stations[3]._id, distance: 116.0 },
      { routeName: 'Colombo - Matara', originStationId: stations[0]._id, destinationStationId: stations[4]._id, distance: 160.0 },
      { routeName: 'Colombo - Jaffna', originStationId: stations[0]._id, destinationStationId: stations[5]._id, distance: 396.0 },
      { routeName: 'Colombo - Anuradhapura', originStationId: stations[0]._id, destinationStationId: stations[6]._id, distance: 206.0 },
      { routeName: 'Colombo - Badulla', originStationId: stations[0]._id, destinationStationId: stations[7]._id, distance: 292.0 },
      { routeName: 'Kandy - Badulla', originStationId: stations[2]._id, destinationStationId: stations[7]._id, distance: 177.0 },
      { routeName: 'Galle - Matara', originStationId: stations[3]._id, destinationStationId: stations[4]._id, distance: 44.0 },
      { routeName: 'Colombo - Trincomalee', originStationId: stations[0]._id, destinationStationId: stations[9]._id, distance: 300.0 },
      { routeName: 'Colombo - Polonnaruwa', originStationId: stations[0]._id, destinationStationId: stations[8]._id, distance: 264.0 },
    ]);
    console.log(`✅ Seeded ${routes.length} routes`);

    // ─── Schedules ───────────────────────────────────────────
    const schedules = await Schedule.insertMany([
      { trainId: trains[0]._id, routeId: routes[0]._id, departureTime: '05:55', arrivalTime: '09:15', daysOfOperation: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], price: 400.00, status: 'active' },
      { trainId: trains[1]._id, routeId: routes[0]._id, departureTime: '09:45', arrivalTime: '13:05', daysOfOperation: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], price: 400.00, status: 'active' },
      { trainId: trains[2]._id, routeId: routes[1]._id, departureTime: '06:15', arrivalTime: '09:30', daysOfOperation: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], price: 350.00, status: 'active' },
      { trainId: trains[3]._id, routeId: routes[2]._id, departureTime: '06:55', arrivalTime: '11:10', daysOfOperation: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], price: 500.00, status: 'active' },
      { trainId: trains[4]._id, routeId: routes[4]._id, departureTime: '05:45', arrivalTime: '11:30', daysOfOperation: ['Monday', 'Wednesday', 'Friday', 'Sunday'], price: 600.00, status: 'active' },
      { trainId: trains[5]._id, routeId: routes[3]._id, departureTime: '05:30', arrivalTime: '14:00', daysOfOperation: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], price: 1200.00, status: 'active' },
      { trainId: trains[6]._id, routeId: routes[3]._id, departureTime: '18:00', arrivalTime: '02:30', daysOfOperation: ['Monday', 'Thursday', 'Saturday'], price: 1100.00, status: 'active' },
      { trainId: trains[0]._id, routeId: routes[5]._id, departureTime: '08:30', arrivalTime: '18:45', daysOfOperation: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], price: 800.00, status: 'active' },
      { trainId: trains[1]._id, routeId: routes[6]._id, departureTime: '07:00', arrivalTime: '14:30', daysOfOperation: ['Tuesday', 'Thursday', 'Saturday'], price: 550.00, status: 'active' },
      { trainId: trains[7]._id, routeId: routes[0]._id, departureTime: '07:00', arrivalTime: '08:00', daysOfOperation: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], price: 100.00, status: 'active' },
      { trainId: trains[2]._id, routeId: routes[7]._id, departureTime: '10:30', arrivalTime: '11:45', daysOfOperation: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], price: 150.00, status: 'active' },
      { trainId: trains[8]._id, routeId: routes[5]._id, departureTime: '20:00', arrivalTime: '06:30', daysOfOperation: ['Monday', 'Wednesday', 'Friday'], price: 750.00, status: 'active' },
      { trainId: trains[9]._id, routeId: routes[8]._id, departureTime: '06:00', arrivalTime: '14:00', daysOfOperation: ['Monday', 'Thursday', 'Saturday'], price: 700.00, status: 'cancelled' },
      { trainId: trains[4]._id, routeId: routes[9]._id, departureTime: '07:30', arrivalTime: '15:00', daysOfOperation: ['Tuesday', 'Friday', 'Sunday'], price: 650.00, status: 'active' },
      { trainId: trains[3]._id, routeId: routes[1]._id, departureTime: '15:30', arrivalTime: '18:45', daysOfOperation: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], price: 350.00, status: 'active' },
    ]);
    console.log(`✅ Seeded ${schedules.length} schedules`);

    console.log('\n🎉 Seeding complete!');
    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err.message);
    console.error(err);
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
};

seed();
