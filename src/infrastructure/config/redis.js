const Redis = require('ioredis');
const logger = require('./logger');

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const redis = new Redis(redisUrl, {
  lazyConnect: true,
  enableOfflineQueue: false,
  maxRetriesPerRequest: 1,
});

// Promessa que resolve quando o Redis estiver pronto
const waitForRedis = () => {
  return new Promise((resolve, reject) => {
    if (redis.status === 'ready') {
      resolve(redis);
    } else {
      redis.once('ready', () => resolve(redis));
      redis.once('error', (err) => reject(err));
      setTimeout(() => reject(new Error('Redis timeout')), 5000);
    }
  });
};

redis.on('connect', () => {
  logger.info('[Redis] Conectado');
});
redis.on('error', (err) => {
  logger.error({ err }, '[Redis] Erro de conexão');
});
redis.on('close', () => {
  logger.warn('[Redis] Conexão encerrada');
});

module.exports = { redis, waitForRedis };