const { redis } = require('../config/redis'); // USE DESESTRUTURAÇÃO {}
const logger = require('../config/logger');

class CacheService {
  async get(key) {
    try {
      // Verificação de segurança: se o redis não estiver pronto ou falhar
      if (!redis || typeof redis.get !== 'function') return null;
      
      const data = await redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error({ error, key }, 'Erro ao buscar no cache Redis');
      return null;
    }
  }

  async set(key, value, ttl = 3600) {
    try {
      if (!redis || typeof redis.set !== 'function') return;
      
      const stringValue = JSON.stringify(value);
      await redis.set(key, stringValue, 'EX', ttl);
    } catch (error) {
      logger.error({ error, key }, 'Erro ao salvar no cache Redis');
    }
  }

  async delPattern(pattern) {
    try {
      if (!redis || typeof redis.keys !== 'function') return;
      
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(keys);
      }
    } catch (error) {
      logger.error({ error, pattern }, 'Erro ao invalidar cache por padrão');
    }
  }
}

module.exports = new CacheService();