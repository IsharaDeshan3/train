// NOTE: dotenv is intentionally NOT called here — only in server.js.
const { createClient } = require('redis');

// Helper to clean up accidentally copy-pasted environment variables
const getCleanRedisUrl = () => {
  let url = process.env.REDIS_URL;
  if (!url) return null;
  // Strip accidental "REDIS_URL=" from the start of the value
  if (url.startsWith('REDIS_URL=')) url = url.replace('REDIS_URL=', '');
  // Strip accidental quotes
  url = url.replace(/^["']|["']$/g, '');
  return url;
};

const cleanUrl = getCleanRedisUrl();

const redisConfig = cleanUrl 
  ? { url: cleanUrl } 
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
