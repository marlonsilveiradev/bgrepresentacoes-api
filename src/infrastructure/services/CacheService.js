/**
 * CACHE SERVICE: Gerenciar cache com fallback em memória
 * 
 * Tenta usar Redis, se falhar usa memória local
 */

const { redis, waitForRedis } = require('../config/redis');
const logger = require('../config/logger');

class CacheService {
  constructor() {
    this.localCache = new Map(); // Fallback em memória
    this.redisReady = false;
    this.initializeRedis();
  }

  /**
   * Inicializar Redis e definir flag de prontidão
   */
  async initializeRedis() {
    try {
      await waitForRedis();
      this.redisReady = true;
      logger.info('[CacheService] Redis pronto para uso');
    } catch (error) {
      logger.warn('[CacheService] Redis indisponível, usando cache em memória', error.message);
      this.redisReady = false;
    }
  }

  /**
   * SET: Guardar valor no cache (Redis ou memória)
   */
  async set(key, value, ttl = 3600) {
    try {
      if (this.redisReady && redis.status === 'ready') {
        // ✅ Usar Redis
        await redis.setex(key, ttl, JSON.stringify(value));
        return;
      }
    } catch (error) {
      logger.warn(`[CacheService.set] Erro ao usar Redis para key "${key}":`, error.message);
    }

    // ✅ FALLBACK: Usar memória local
    this.localCache.set(key, {
      value,
      expiresAt: Date.now() + (ttl * 1000),
    });
  }

  /**
   * GET: Recuperar valor do cache
   */
  async get(key) {
    try {
      if (this.redisReady && redis.status === 'ready') {
        // ✅ Tentar Redis
        const cached = await redis.get(key);
        if (cached) {
          return JSON.parse(cached);
        }
        return null;
      }
    } catch (error) {
      logger.warn(`[CacheService.get] Erro ao usar Redis para key "${key}":`, error.message);
    }

    // ✅ FALLBACK: Usar memória local
    const item = this.localCache.get(key);
    if (!item) return null;

    // Verificar se expirou
    if (item.expiresAt < Date.now()) {
      this.localCache.delete(key);
      return null;
    }

    return item.value;
  }

  /**
   * DEL: Deletar chave do cache
   */
  async del(key) {
    try {
      if (this.redisReady && redis.status === 'ready') {
        // ✅ Usar Redis
        await redis.del(key);
        return;
      }
    } catch (error) {
      logger.warn(`[CacheService.del] Erro ao usar Redis para key "${key}":`, error.message);
    }

    // ✅ FALLBACK: Usar memória local
    this.localCache.delete(key);
  }

  /**
   * DEL PATTERN: Deletar múltiplas chaves por padrão
   */
  async delPattern(pattern) {
    try {
      if (this.redisReady && redis.status === 'ready') {
        // ✅ Usar Redis (SCAN para não bloquear)
        const keys = [];
        let cursor = '0';
        
        do {
          const [newCursor, matchedKeys] = await redis.scan(
            cursor,
            'MATCH',
            pattern,
            'COUNT',
            100
          );
          cursor = newCursor;
          keys.push(...matchedKeys);
        } while (cursor !== '0');

        if (keys.length > 0) {
          await redis.del(...keys);
        }
        return;
      }
    } catch (error) {
      logger.warn(`[CacheService.delPattern] Erro ao usar Redis para pattern "${pattern}":`, error.message);
    }

    // ✅ FALLBACK: Usar memória local
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    for (const key of this.localCache.keys()) {
      if (regex.test(key)) {
        this.localCache.delete(key);
      }
    }
  }

  /**
   * FLUSH: Limpar todo o cache
   */
  async flush() {
    try {
      if (this.redisReady && redis.status === 'ready') {
        // ✅ Usar Redis
        await redis.flushdb();
        logger.info('[CacheService] Redis flushado');
        return;
      }
    } catch (error) {
      logger.warn('[CacheService.flush] Erro ao usar Redis:', error.message);
    }

    // ✅ FALLBACK: Usar memória local
    this.localCache.clear();
    logger.info('[CacheService] Cache em memória flushado');
  }

  /**
   * HEALTH: Verificar status do cache
   */
  getStatus() {
    return {
      redisReady: this.redisReady,
      redisConnected: redis.status === 'ready',
      localCacheSize: this.localCache.size,
      mode: this.redisReady && redis.status === 'ready' ? 'Redis' : 'Memory',
    };
  }
}

module.exports = new CacheService();