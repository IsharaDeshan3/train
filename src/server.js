require('dotenv').config();
const app = require('./app');
const { connectDatabase, mongoose } = require('./config/database');
const { connectRedis } = require('./config/redis');
const { connectKafka, disconnectKafka } = require('./config/kafka');

const PORT = process.env.PORT || 4000;

const startServer = async () => {
  // ── MongoDB (required) ───────────────────────────────────────────────────
  // The service cannot function without a database; fail fast if unreachable.
  try {
    await connectDatabase();
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  }

  // ── Redis (optional) ─────────────────────────────────────────────────────
  // Redis is used only for schedule-search caching; the service is operational
  // even when Redis is unavailable.
  await connectRedis();

  // ── Kafka producer (optional) ────────────────────────────────────────────
  // Domain events are published best-effort; a missing Kafka broker is logged
  // but does not abort startup.
  await connectKafka();

  // ── Express HTTP server ──────────────────────────────────────────────────
  const server = app.listen(PORT, () => {
    console.log(`🚂 Train Management Service running on port ${PORT}`);
    console.log(`📚 API Docs: http://localhost:${PORT}/api-docs`);
    console.log(`❤️  Health:   http://localhost:${PORT}/health`);
  });

  // ── Graceful shutdown ────────────────────────────────────────────────────
  const shutdown = async (signal) => {
    console.log(`\n⚠️  ${signal} received — shutting down gracefully…`);
    server.close(async () => {
      try {
        await disconnectKafka();
        await mongoose.connection.close();
        console.log('✅ Connections closed. Goodbye!');
      } catch (err) {
        console.error('Error during shutdown:', err.message);
      }
      process.exit(0);
    });
  };

  process.on('SIGINT',  () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
};

startServer();
