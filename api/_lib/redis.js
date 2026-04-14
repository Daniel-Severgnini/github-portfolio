const { Redis } = require('@upstash/redis');

let redisClient = null;

const getRedis = () => {
  if (redisClient) return redisClient;

  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) return null;

  redisClient = new Redis({ url, token });
  return redisClient;
};

module.exports = {
  getRedis,
};
