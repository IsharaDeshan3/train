const mongoose = require('mongoose');
// NOTE: dotenv is intentionally NOT called here.
// It is called once at the very top of server.js, before any other module loads.
// Calling it here again is redundant and can mask Railway's injected env vars.

const isProduction = process.env.NODE_ENV === 'production';

const getMongoUri = () => {
  // Railway and other cloud providers inject vars directly into process.env.
  // Check all common variable names in priority order.
  const uri =
    process.env.MONGODB_URI ||
    process.env.MONGO_URI    ||
    process.env.MONGODB_URL  ||
    process.env.MONGO_URL    ||
    (process.env.DATABASE_URL?.startsWith('mongodb') ? process.env.DATABASE_URL : null);

  if (uri) return uri;

  // Fallback to individual components (local development only)
  const host   = process.env.MONGO_HOST   || 'localhost';
  const port   = process.env.MONGO_PORT   || 27017;
  const dbName = process.env.MONGO_DB_NAME || 'train_management';
  return `mongodb://${host}:${port}/${dbName}`;
};

const connectDatabase = async () => {
  const mongoUri = getMongoUri();

  // ── Startup diagnostic ──────────────────────────────────────────────────
  // Log which variable was resolved and a redacted form of the URI so we can
  // confirm the correct value is being used without exposing credentials.
  const resolvedFrom =
    process.env.MONGODB_URI ? 'MONGODB_URI' :
    process.env.MONGO_URI   ? 'MONGO_URI'   :
    process.env.MONGODB_URL ? 'MONGODB_URL' :
    process.env.MONGO_URL   ? 'MONGO_URL'   :
    process.env.DATABASE_URL?.startsWith('mongodb') ? 'DATABASE_URL' :
    'fallback (localhost)';

  const redactedUri = mongoUri.replace(/:\/\/([^:]+):([^@]+)@/, '://<user>:<pass>@');
  console.log(`🔍 Mongo source : ${resolvedFrom}`);
  console.log(`🔍 Mongo URI    : ${redactedUri}`);
  // ───────────────────────────────────────────────────────────────────────

  await mongoose.connect(mongoUri, {
    maxPoolSize:              Number(process.env.MONGO_MAX_POOL_SIZE              || 20),
    minPoolSize:              Number(process.env.MONGO_MIN_POOL_SIZE              || 0),
    serverSelectionTimeoutMS: Number(process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS || 30000),
    autoIndex: !isProduction,
  });

  return mongoose.connection;
};

module.exports = {
  mongoose,
  connectDatabase,
  getMongoUri,
};
