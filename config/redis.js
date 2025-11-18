import { createClient } from 'redis';

let redisClient = null;
let isRedisConnected = false;

// Only create Redis client if explicitly enabled
const REDIS_ENABLED = process.env.REDIS_ENABLED === 'true';

if (REDIS_ENABLED) {
  redisClient = createClient({
    socket: {
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
    },
  });

  redisClient.on('error', (err) => {
    console.error('Redis Client Error:', err.message);
    isRedisConnected = false;
  });

  redisClient.on('connect', () => {
    console.log('Redis Connected');
    isRedisConnected = true;
  });

  // Connect to Redis
  (async () => {
    try {
      await redisClient.connect();
    } catch (error) {
      console.error('Failed to connect to Redis:', error.message);
      console.log('Redis is optional - continuing without cache...');
      isRedisConnected = false;
    }
  })();
} else {
  console.log('Redis is disabled - running without cache');
}

// Safe Redis operations wrapper
export const safeRedisGet = async (key) => {
  if (!isRedisConnected || !redisClient) return null;
  try {
    return await redisClient.get(key);
  } catch (error) {
    console.error('Redis GET error:', error.message);
    return null;
  }
};

export const safeRedisSet = async (key, value, options) => {
  if (!isRedisConnected || !redisClient) return false;
  try {
    await redisClient.set(key, value, options);
    return true;
  } catch (error) {
    console.error('Redis SET error:', error.message);
    return false;
  }
};

export const safeRedisDel = async (key) => {
  if (!isRedisConnected || !redisClient) return false;
  try {
    await redisClient.del(key);
    return true;
  } catch (error) {
    console.error('Redis DEL error:', error.message);
    return false;
  }
};

export const safeRedisIncr = async (key) => {
  if (!isRedisConnected || !redisClient) return null;
  try {
    return await redisClient.incr(key);
  } catch (error) {
    console.error('Redis INCR error:', error.message);
    return null;
  }
};

export { isRedisConnected };
export default redisClient;
