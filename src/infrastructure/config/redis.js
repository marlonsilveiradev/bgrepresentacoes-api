const Redis = require('ioredis');

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const redis = new Redis(redisUrl);

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
  console.log('[Redis] Conectado');
});
redis.on('error', (err) => {
  console.error('[Redis] Erro:', err);
});

module.exports = { redis, waitForRedis };