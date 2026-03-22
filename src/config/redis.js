const { createClient } = require('redis');
require('dotenv').config();

const redisConfig = process.env.REDIS_URL 
  ? { url: process.env.REDIS_URL } 
  : {
      socket: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
      },
    };

const redisClient = createClient(redisConfig);

redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err.message);
});

redisClient.on('connect', () => {
  console.log('✅ Connected to Redis');
});

const connectRedis = async () => {
  try {
    await redisClient.connect();
  } catch (err) {
    console.error('Failed to connect to Redis:', err.message);
  }
};

module.exports = { redisClient, connectRedis };
