const request = require('supertest');
const app = require('../src/app');

// ─── Mock Mongoose models ────────────────────────────────────────────────────
// The repositories call Mongoose static methods directly on the model objects.
// We intercept those at the model layer so no real DB is needed.
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
  kafkaEnabled: jest.fn().mockReturnValue(false), // disable publishing in tests
  isKafkaProducerConnected: jest.fn().mockReturnValue(false),
  connectKafka: jest.fn(),
  disconnectKafka: jest.fn(),
}));

const { Train } = require('../src/models');

// Helper: Mongoose documents returned by find() need a chainable .sort() call
const withSort = (result) => ({ sort: jest.fn().mockResolvedValue(result) });

// Helper: create a minimal Mongoose-like document stub
const makeTrainDoc = (data) => ({
  ...data,
  toJSON: () => ({ ...data }),
});

describe('Train API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── GET /api/trains ────────────────────────────────────────────────────────
  describe('GET /api/trains', () => {
    it('should return all trains', async () => {
      const mockTrains = [
        makeTrainDoc({ id: '60f1b2c3d4e5f67890abcde1', trainNumber: 'T1001', name: 'Udarata Menike', type: 'intercity', totalSeats: 300, status: 'active' }),
        makeTrainDoc({ id: '60f1b2c3d4e5f67890abcde2', trainNumber: 'T1002', name: 'Podi Menike', type: 'intercity', totalSeats: 280, status: 'active' }),
      ];

      Train.find.mockReturnValue(withSort(mockTrains));

      const res = await request(app).get('/api/trains');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[0].trainNumber).toBe('T1001');
    });

    it('should return empty array when no trains exist', async () => {
      Train.find.mockReturnValue(withSort([]));

      const res = await request(app).get('/api/trains');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(0);
    });
  });

  // ── GET /api/trains/:id ────────────────────────────────────────────────────
  describe('GET /api/trains/:id', () => {
    it('should return a train by ID', async () => {
      const mockTrain = makeTrainDoc({ id: '60f1b2c3d4e5f67890abcde1', trainNumber: 'T1001', name: 'Udarata Menike', type: 'intercity', totalSeats: 300, status: 'active' });
      Train.findById.mockResolvedValue(mockTrain);

      const res = await request(app).get('/api/trains/60f1b2c3d4e5f67890abcde1');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.trainNumber).toBe('T1001');
    });

    it('should return 404 for non-existent train', async () => {
      Train.findById.mockResolvedValue(null);

      const res = await request(app).get('/api/trains/60f1b2c3d4e5f67890abcde9');

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  // ── POST /api/trains ───────────────────────────────────────────────────────
  describe('POST /api/trains', () => {
    it('should create a new train', async () => {
      const newTrain = { trainNumber: 'T2001', name: 'New Express', type: 'express', totalSeats: 250, status: 'active' };
      const createdTrain = makeTrainDoc({ id: '60f1b2c3d4e5f67890abcde3', ...newTrain });

      Train.findOne.mockResolvedValue(null); // no duplicate
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
      const existingTrain = makeTrainDoc({ id: '60f1b2c3d4e5f67890abcde1', trainNumber: 'T1001', name: 'Udarata Menike' });
      Train.findOne.mockResolvedValue(existingTrain);

      const res = await request(app).post('/api/trains').send({ trainNumber: 'T1001', name: 'Duplicate' });

      expect(res.statusCode).toBe(409);
      expect(res.body.success).toBe(false);
    });
  });

  // ── PUT /api/trains/:id ────────────────────────────────────────────────────
  describe('PUT /api/trains/:id', () => {
    it('should update a train', async () => {
      const updatedTrain = makeTrainDoc({ id: '60f1b2c3d4e5f67890abcde1', trainNumber: 'T1001', name: 'Updated Menike', type: 'intercity', totalSeats: 350, status: 'active' });

      Train.findOne.mockResolvedValue(null); // no conflicting trainNumber
      Train.findByIdAndUpdate.mockResolvedValue(updatedTrain);

      const res = await request(app).put('/api/trains/60f1b2c3d4e5f67890abcde1').send({ name: 'Updated Menike', totalSeats: 350 });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 404 when train not found', async () => {
      Train.findOne.mockResolvedValue(null);
      Train.findByIdAndUpdate.mockResolvedValue(null);

      const res = await request(app).put('/api/trains/60f1b2c3d4e5f67890abcde9').send({ name: 'Not Found' });

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  // ── DELETE /api/trains/:id ─────────────────────────────────────────────────
  describe('DELETE /api/trains/:id', () => {
    it('should delete a train', async () => {
      const mockTrain = makeTrainDoc({ id: '60f1b2c3d4e5f67890abcde1', trainNumber: 'T1001', name: 'Udarata Menike' });
      Train.findByIdAndDelete.mockResolvedValue(mockTrain);

      const res = await request(app).delete('/api/trains/60f1b2c3d4e5f67890abcde1');

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Train deleted successfully');
    });

    it('should return 404 when train not found', async () => {
      Train.findByIdAndDelete.mockResolvedValue(null);

      const res = await request(app).delete('/api/trains/60f1b2c3d4e5f67890abcde9');

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  // ── GET /health ────────────────────────────────────────────────────────────
  describe('GET /health', () => {
    it('should return health status', async () => {
      const res = await request(app).get('/health');

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('UP');
      expect(res.body.service).toBe('train-management-service');
    });
  });

  // ── 404 Handler ────────────────────────────────────────────────────────────
  describe('404 Handler', () => {
    it('should return 404 for unknown routes', async () => {
      const res = await request(app).get('/unknown-route');

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });
});
