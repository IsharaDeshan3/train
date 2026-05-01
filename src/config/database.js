const mongoose = require('mongoose');
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';

const getMongoUri = () => {
  // Check common environment variable names used by various cloud providers
  if (process.env.MONGO_URI) return process.env.MONGO_URI;
  if (process.env.MONGODB_URL) return process.env.MONGODB_URL;
  if (process.env.MONGO_URL) return process.env.MONGO_URL;
  
  if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('mongodb')) {
    return process.env.DATABASE_URL;
  }

  const host = process.env.MONGO_HOST || 'localhost';
  const port = process.env.MONGO_PORT || 27017;
  const dbName = process.env.MONGO_DB_NAME || 'train_management';
  return `mongodb://${host}:${port}/${dbName}`;
};

const connectDatabase = async () => {
  const mongoUri = getMongoUri();

  await mongoose.connect(mongoUri, {
    maxPoolSize: Number(process.env.MONGO_MAX_POOL_SIZE || 20),
    minPoolSize: Number(process.env.MONGO_MIN_POOL_SIZE || 0),
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
