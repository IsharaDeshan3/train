const request = require('supertest');
const app = require('../src/app');

// Mock the models
jest.mock('../src/models', () => {
  const mockSequelize = {
    authenticate: jest.fn().mockResolvedValue(true),
    sync: jest.fn().mockResolvedValue(true),
  };

  const mockTrain = {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
  };

  const mockStation = {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
  };

  const mockRoute = {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
  };

  const mockSchedule = {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
  };

  return {
    sequelize: mockSequelize,
    Train: mockTrain,
    Station: mockStation,
    Route: mockRoute,
    Schedule: mockSchedule,
  };
});

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

const { Schedule, Train, Route, Station } = require('../src/models');

describe('Schedule API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/schedules', () => {
    it('should return all schedules', async () => {
      const mockSchedules = [
        {
          id: 1,
          trainId: 1,
          routeId: 1,
          departureTime: '05:55:00',
          arrivalTime: '09:15:00',
          daysOfOperation: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          price: 400.00,
          status: 'active',
          Train: { id: 1, trainNumber: 'T1001', name: 'Udarata Menike' },
          Route: {
            id: 1,
            routeName: 'Colombo - Kandy',
            originStation: { code: 'CMB', name: 'Colombo Fort' },
            destinationStation: { code: 'KDY', name: 'Kandy' },
          },
        },
      ];

      Schedule.findAll.mockResolvedValue(mockSchedules);

      const res = await request(app).get('/api/schedules');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
    });
  });

  describe('GET /api/schedules/:id', () => {
    it('should return a schedule by ID', async () => {
      const mockSchedule = {
        id: 1,
        trainId: 1,
        routeId: 1,
        departureTime: '05:55:00',
        arrivalTime: '09:15:00',
        price: 400.00,
        status: 'active',
      };

      Schedule.findByPk.mockResolvedValue(mockSchedule);

      const res = await request(app).get('/api/schedules/1');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.departureTime).toBe('05:55:00');
    });

    it('should return 404 for non-existent schedule', async () => {
      Schedule.findByPk.mockResolvedValue(null);

      const res = await request(app).get('/api/schedules/999');

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/schedules', () => {
    it('should create a new schedule', async () => {
      const newSchedule = {
        trainId: 1,
        routeId: 1,
        departureTime: '10:00:00',
        arrivalTime: '14:00:00',
        daysOfOperation: ['Monday', 'Wednesday', 'Friday'],
        price: 500.00,
        status: 'active',
      };

      Train.findByPk.mockResolvedValue({ id: 1, trainNumber: 'T1001' });
      Route.findByPk.mockResolvedValue({ id: 1, routeName: 'Colombo - Kandy' });
      Schedule.create.mockResolvedValue({ id: 16, ...newSchedule });

      const res = await request(app).post('/api/schedules').send(newSchedule);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.price).toBe(500.00);
    });

    it('should return 400 when required fields are missing', async () => {
      const res = await request(app).post('/api/schedules').send({ trainId: 1 });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 404 when train does not exist', async () => {
      Train.findByPk.mockResolvedValue(null);

      const res = await request(app).post('/api/schedules').send({
        trainId: 999,
        routeId: 1,
        departureTime: '10:00',
        arrivalTime: '14:00',
      });

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /schedules/search', () => {
    it('should search schedules by origin and destination', async () => {
      const originStation = { id: 1, code: 'CMB', name: 'Colombo Fort' };
      const destStation = { id: 3, code: 'KDY', name: 'Kandy' };

      Station.findOne
        .mockResolvedValueOnce(originStation)
        .mockResolvedValueOnce(destStation);

      const mockResults = [
        {
          id: 1,
          departureTime: '05:55:00',
          arrivalTime: '09:15:00',
          price: 400.00,
          status: 'active',
          Train: { trainNumber: 'T1001', name: 'Udarata Menike' },
          Route: { routeName: 'Colombo - Kandy' },
        },
      ];

      Schedule.findAll.mockResolvedValue(mockResults);

      const res = await request(app).get('/schedules/search?origin=CMB&destination=KDY');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(1);
    });

    it('should return empty array when no schedules match', async () => {
      Station.findOne.mockResolvedValue(null);
      Schedule.findAll.mockResolvedValue([]);

      const res = await request(app).get('/schedules/search?origin=XXX&destination=YYY');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(0);
    });

    it('should search schedules with date filter', async () => {
      Station.findOne.mockResolvedValue({ id: 1, code: 'CMB' });
      Schedule.findAll.mockResolvedValue([]);

      const res = await request(app).get('/schedules/search?origin=CMB&destination=KDY&date=2026-03-25');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
