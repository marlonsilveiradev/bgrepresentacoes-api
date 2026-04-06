const Redis = require('ioredis');
const logger = require('./logger');

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || undefined,
  db: 0,
  lazyConnect: true,
  enableOfflineQueue: false,
  maxRetriesPerRequest: 1,
});

redis.connect().catch((err) => {
  logger.warn({ err }, '[Redis] Erro ao conectar — usando fallback em memória');
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