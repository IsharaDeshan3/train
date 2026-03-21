const request = require('supertest');
const app = require('../src/app');

// Mock the models and services
jest.mock('../src/models', () => {
  const mockSequelize = {
    authenticate: jest.fn().mockResolvedValue(true),
    sync: jest.fn().mockResolvedValue(true),
    define: jest.fn(),
  };

  const mockTrain = {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
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

const { Train } = require('../src/models');

describe('Train API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/trains', () => {
    it('should return all trains', async () => {
      const mockTrains = [
        { id: 1, trainNumber: 'T1001', name: 'Udarata Menike', type: 'intercity', totalSeats: 300, status: 'active' },
        { id: 2, trainNumber: 'T1002', name: 'Podi Menike', type: 'intercity', totalSeats: 280, status: 'active' },
      ];

      Train.findAll.mockResolvedValue(mockTrains);

      const res = await request(app).get('/api/trains');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[0].trainNumber).toBe('T1001');
    });

    it('should return empty array when no trains exist', async () => {
      Train.findAll.mockResolvedValue([]);

      const res = await request(app).get('/api/trains');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(0);
    });
  });

  describe('GET /api/trains/:id', () => {
    it('should return a train by ID', async () => {
      const mockTrain = { id: 1, trainNumber: 'T1001', name: 'Udarata Menike', type: 'intercity', totalSeats: 300, status: 'active' };
      Train.findByPk.mockResolvedValue(mockTrain);

      const res = await request(app).get('/api/trains/1');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.trainNumber).toBe('T1001');
    });

    it('should return 404 for non-existent train', async () => {
      Train.findByPk.mockResolvedValue(null);

      const res = await request(app).get('/api/trains/999');

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/trains', () => {
    it('should create a new train', async () => {
      const newTrain = { trainNumber: 'T2001', name: 'New Express', type: 'express', totalSeats: 250, status: 'active' };
      const createdTrain = { id: 11, ...newTrain };

      Train.findOne.mockResolvedValue(null);
      Train.create.mockResolvedValue(createdTrain);

      const res = await request(app).post('/api/trains').send(newTrain);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.trainNumber).toBe('T2001');
    });

    it('should return 400 when required fields are missing', async () => {
      const res = await request(app).post('/api/trains').send({ type: 'express' });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 409 for duplicate train number', async () => {
      const existingTrain = { id: 1, trainNumber: 'T1001', name: 'Udarata Menike' };
      Train.findOne.mockResolvedValue(existingTrain);

      const res = await request(app).post('/api/trains').send({ trainNumber: 'T1001', name: 'Duplicate' });

      expect(res.statusCode).toBe(409);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PUT /api/trains/:id', () => {
    it('should update a train', async () => {
      const updatedTrain = { id: 1, trainNumber: 'T1001', name: 'Updated Menike', type: 'intercity', totalSeats: 350, status: 'active', update: jest.fn() };
      updatedTrain.update.mockResolvedValue({ ...updatedTrain, name: 'Updated Menike', totalSeats: 350 });

      Train.findOne.mockResolvedValue(null);
      Train.findByPk.mockResolvedValue(updatedTrain);

      const res = await request(app).put('/api/trains/1').send({ name: 'Updated Menike', totalSeats: 350 });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 404 when train not found', async () => {
      Train.findOne.mockResolvedValue(null);
      Train.findByPk.mockResolvedValue(null);

      const res = await request(app).put('/api/trains/999').send({ name: 'Not Found' });

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('DELETE /api/trains/:id', () => {
    it('should delete a train', async () => {
      const mockTrain = { id: 1, trainNumber: 'T1001', name: 'Udarata Menike', destroy: jest.fn() };
      Train.findByPk.mockResolvedValue(mockTrain);

      const res = await request(app).delete('/api/trains/1');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Train deleted successfully');
    });

    it('should return 404 when train not found', async () => {
      Train.findByPk.mockResolvedValue(null);

      const res = await request(app).delete('/api/trains/999');

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const res = await request(app).get('/health');

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('UP');
      expect(res.body.service).toBe('train-management-service');
    });
  });

  describe('404 Handler', () => {
    it('should return 404 for unknown routes', async () => {
      const res = await request(app).get('/unknown-route');

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });
});
