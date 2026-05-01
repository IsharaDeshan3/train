const request = require('supertest');
const app = require('../src/app');

// ─── Mock Mongoose models ────────────────────────────────────────────────────
jest.mock('../src/models', () => {
  const makeMockModel = () => ({
    find: jest.fn(),
    findById: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    insertMany: jest.fn(),
    deleteMany: jest.fn(),
    select: jest.fn(),
  });

  return {
    mongoose: { connection: { readyState: 1 } },
    Train: makeMockModel(),
    Station: makeMockModel(),
    Route: makeMockModel(),
    Schedule: makeMockModel(),
  };
});

// ─── Mock Redis (optional cache layer) ──────────────────────────────────────
jest.mock('../src/config/redis', () => ({
  redisClient: {
    isOpen: false,
    get: jest.fn(),
    setEx: jest.fn(),
    keys: jest.fn().mockResolvedValue([]),
    del: jest.fn(),
  },
  connectRedis: jest.fn(),
}));

// ─── Mock Kafka (event publisher) ───────────────────────────────────────────
jest.mock('../src/config/kafka', () => ({
  kafkaProducer: { send: jest.fn().mockResolvedValue(undefined) },
  kafkaEnabled: jest.fn().mockReturnValue(false),
  isKafkaProducerConnected: jest.fn().mockReturnValue(false),
  connectKafka: jest.fn(),
  disconnectKafka: jest.fn(),
}));

const { Schedule, Train, Route, Station } = require('../src/models');

// Helper: return a populate()-chainable query that resolves to data
const withPopulate = (result) => {
  const chain = {
    populate: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    then: (resolve) => Promise.resolve(result).then(resolve),
    [Symbol.toStringTag]: 'Promise',
  };
  // Make it await-able
  chain.then = chain.then.bind(chain);
  return chain;
};

// Helper: Mongoose documents with toJSON()
const makeDoc = (data) => ({ ...data, toJSON: () => ({ ...data }) });

// Minimal schedule document shape expected by scheduleRepository.mapScheduleForResponse
const makeScheduleDoc = (data) => {
  const doc = {
    ...data,
    toJSON: () => ({
      ...data,
      trainId: data.Train || data.trainId,
      routeId: data.Route || data.routeId,
    }),
  };
  return doc;
};

describe('Schedule API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── GET /api/schedules ─────────────────────────────────────────────────────
  describe('GET /api/schedules', () => {
    it('should return all schedules', async () => {
      const trainDoc = makeDoc({ id: '60a1', trainNumber: 'T1001', name: 'Udarata Menike', type: 'intercity', totalSeats: 300, status: 'active' });
      const routeDoc = makeDoc({
        id: '60b1',
        routeName: 'Colombo - Kandy',
        distance: 115,
        originStationId: makeDoc({ id: '60c1', code: 'CMB', name: 'Colombo Fort', city: 'Colombo' }),
        destinationStationId: makeDoc({ id: '60c2', code: 'KDY', name: 'Kandy', city: 'Kandy' }),
      });

      const mockSchedules = [
        makeDoc({
          id: '60d1',
          trainId: trainDoc,
          routeId: routeDoc,
          departureTime: '05:55',
          arrivalTime: '09:15',
          daysOfOperation: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          price: 400.00,
          status: 'active',
        }),
      ];

      // populateScheduleQuery chains: Schedule.find().sort().populate().populate()
      const queryChain = {
        sort: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
      };
      // Make the chain thenable so await resolves mockSchedules
      queryChain[Symbol.for('nodejs.util.inspect.custom')] = undefined;
      Schedule.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockResolvedValue(mockSchedules),
          }),
        }),
      });

      const res = await request(app).get('/api/schedules');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
    });
  });

  // ── GET /api/schedules/:id ─────────────────────────────────────────────────
  describe('GET /api/schedules/:id', () => {
    it('should return a schedule by ID', async () => {
      const trainDoc = makeDoc({ id: '60a1', trainNumber: 'T1001', name: 'Udarata Menike', type: 'intercity', totalSeats: 300, status: 'active' });
      const routeDoc = makeDoc({
        id: '60b1',
        routeName: 'Colombo - Kandy',
        distance: 115,
        originStationId: makeDoc({ id: '60c1', code: 'CMB', name: 'Colombo Fort', city: 'Colombo' }),
        destinationStationId: makeDoc({ id: '60c2', code: 'KDY', name: 'Kandy', city: 'Kandy' }),
      });

      const mockSchedule = makeDoc({
        id: '60d1',
        trainId: trainDoc,
        routeId: routeDoc,
        departureTime: '05:55',
        arrivalTime: '09:15',
        price: 400.00,
        status: 'active',
      });

      Schedule.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockSchedule),
        }),
      });

      const res = await request(app).get('/api/schedules/60d1b2c3d4e5f67890abcde1');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.departureTime).toBe('05:55');
    });

    it('should return 404 for non-existent schedule', async () => {
      Schedule.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(null),
        }),
      });

      const res = await request(app).get('/api/schedules/60f1b2c3d4e5f67890abcde9');

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  // ── POST /api/schedules ────────────────────────────────────────────────────
  describe('POST /api/schedules', () => {
    it('should create a new schedule', async () => {
      const newSchedule = {
        trainId: '60a1b2c3d4e5f67890abcde1',
        routeId: '60b1b2c3d4e5f67890abcde1',
        departureTime: '10:00',
        arrivalTime: '14:00',
        daysOfOperation: ['Monday', 'Wednesday', 'Friday'],
        price: 500.00,
        status: 'active',
      };

      const trainDoc = makeDoc({ id: newSchedule.trainId, trainNumber: 'T1001' });
      const routeDoc = makeDoc({ id: newSchedule.routeId, routeName: 'Colombo - Kandy' });
      const createdSchedule = makeDoc({ id: '60d1b2c3d4e5f67890abcde1', ...newSchedule });

      Train.findById.mockResolvedValue(trainDoc);
      Route.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(routeDoc),
        }),
      });
      Schedule.create.mockResolvedValue(createdSchedule);

      const res = await request(app).post('/api/schedules').send(newSchedule);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.price).toBe(500.00);
    });

    it('should return 400 when required fields are missing', async () => {
      const res = await request(app).post('/api/schedules').send({ trainId: '60a1b2c3d4e5f67890abcde1' });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 404 when train does not exist', async () => {
      Train.findById.mockResolvedValue(null);

      const res = await request(app).post('/api/schedules').send({
        trainId: '60f9b2c3d4e5f67890abcde9',
        routeId: '60b1b2c3d4e5f67890abcde1',
        departureTime: '10:00',
        arrivalTime: '14:00',
      });

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  // ── GET /schedules/search (integration endpoint) ───────────────────────────
  describe('GET /schedules/search', () => {
    it('should search schedules by origin and destination', async () => {
      const originStation = makeDoc({ _id: '60c1', code: 'CMB', name: 'Colombo Fort' });
      const destStation   = makeDoc({ _id: '60c2', code: 'KDY', name: 'Kandy' });

      Station.findOne
        .mockResolvedValueOnce(originStation)
        .mockResolvedValueOnce(destStation);

      // Route.find().select('_id') => matched route IDs
      Route.find.mockReturnValue({
        select: jest.fn().mockResolvedValue([{ _id: '60b1' }]),
      });

      const mockResults = [
        makeDoc({
          id: '60d1',
          trainId: makeDoc({ id: '60a1', trainNumber: 'T1001', name: 'Udarata Menike', type: 'intercity', totalSeats: 300, status: 'active' }),
          routeId: makeDoc({
            id: '60b1',
            routeName: 'Colombo - Kandy',
            distance: 115,
            originStationId: makeDoc({ id: '60c1', code: 'CMB', name: 'Colombo Fort', city: 'Colombo' }),
            destinationStationId: makeDoc({ id: '60c2', code: 'KDY', name: 'Kandy', city: 'Kandy' }),
          }),
          departureTime: '05:55',
          arrivalTime: '09:15',
          price: 400.00,
          status: 'active',
        }),
      ];

      Schedule.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockResolvedValue(mockResults),
          }),
        }),
      });

      const res = await request(app).get('/schedules/search?origin=CMB&destination=KDY');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(1);
    });

    it('should return empty array when no matching stations found', async () => {
      Station.findOne.mockResolvedValue(null);

      // When station not found, matchedRouteIds stays null, so no Route.find call
      // but Schedule.find is still called with the filter
      Schedule.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      const res = await request(app).get('/schedules/search?origin=XXX&destination=YYY');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(0);
    });

    it('should search schedules with date filter', async () => {
      const originStation = makeDoc({ _id: '60c1', code: 'CMB', name: 'Colombo Fort' });
      const destStation   = makeDoc({ _id: '60c2', code: 'KDY', name: 'Kandy' });

      Station.findOne
        .mockResolvedValueOnce(originStation)
        .mockResolvedValueOnce(destStation);

      Route.find.mockReturnValue({
        select: jest.fn().mockResolvedValue([{ _id: '60b1' }]),
      });

      Schedule.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      const res = await request(app).get('/schedules/search?origin=CMB&destination=KDY&date=2026-03-25');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
