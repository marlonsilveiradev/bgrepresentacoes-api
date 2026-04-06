/**
 * RATE LIMITER: Proteção contra abuso de requisições
 * 
 * ✅ Usa Redis com fallback em memória
 * ✅ Inicialização síncrona e segura
 */

const rateLimit = require('express-rate-limit');
// ✅ CORRIGIDO: Forma correta de importar RedisStore
const RedisStore = require('rate-limit-redis').RedisStore || require('rate-limit-redis');
const { redis } = require('../../../infrastructure/config/redis');
const appConfig = require('../../../infrastructure/config/config');
const logger = require('../../../infrastructure/config/logger');

// ─── Status de inicialização ───────────────────────────────────────────────

let redisReady = false;
let defaultLimiterMiddleware = null;
let authLimiterMiddleware = null;

// ─── Inicialização do Redis ───────────────────────────────────────────────

/**
 * Monitorar status do Redis e atualizar limiters quando conectar
 */
const setupRedisMonitoring = () => {
  redis.on('ready', () => {
    if (redisReady) return; // Já estava pronto
    
    logger.info('[RateLimiter] Redis conectado, ativando store Redis');
    redisReady = true;
    
    // ✅ Atualizar limiters para usar Redis
    initializeLimitersWithRedis();
  });

  redis.on('error', (err) => {
    if (redisReady) {
      logger.warn('[RateLimiter] Redis desconectou, voltando para fallback em memória');
      redisReady = false;
      
      // ✅ Voltar para limiters em memória
      initializeLimitersWithMemory();
    }
  });

  redis.on('close', () => {
    redisReady = false;
  });
};

// ─── Criar limiters com Redis ───────────────────────────────────────────────

const initializeLimitersWithRedis = () => {
  try {
    // ✅ Verificar se RedisStore é válido
    if (!RedisStore || typeof RedisStore !== 'function') {
      logger.error('[RateLimiter] RedisStore não é um construtor válido, usando memória');
      initializeLimitersWithMemory();
      return;
    }

    const redisStore = new RedisStore({
      sendCommand: (...args) => redis.call(...args),
      prefix: 'rl:',
    });

    defaultLimiterMiddleware = rateLimit({
      windowMs: appConfig.rateLimit.windowMs,
      max: appConfig.rateLimit.max,
      standardHeaders: true,
      legacyHeaders: false,
      store: redisStore,
      handler: (req, res, next, options) => {
        logger.warn({
          type: 'RATE_LIMIT_BLOCK',
          ip: req.ip,
          path: req.originalUrl,
          method: req.method,
          store: 'Redis',
        });

        return res.status(options.statusCode).json({
          status: 'fail',
          message: 'Muitas requisições. Tente novamente mais tarde.',
        });
      },
    });

    authLimiterMiddleware = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: appConfig.rateLimit.authMax,
      standardHeaders: true,
      legacyHeaders: false,
      store: redisStore,
      skipSuccessfulRequests: true,
      keyGenerator: (req) => `${req.ip}_${req.body?.email || 'unknown'}`,
      handler: (req, res, next, options) => {
        logger.error({
          type: 'SECURITY_AUTH_BLOCK',
          message: 'Bloqueio por múltiplas tentativas de login',
          ip: req.ip,
          path: req.originalUrl,
          userAgent: req.get('User-Agent'),
          store: 'Redis',
        });

        return res.status(options.statusCode).json({
          status: 'fail',
          message: 'Muitas tentativas de autenticação. Tente novamente em alguns minutos.',
        });
      },
    });

    logger.info('[RateLimiter] Limiters com Redis ativados');
  } catch (error) {
    logger.error('[RateLimiter] Erro ao criar store Redis:', error.message);
    initializeLimitersWithMemory();
  }
};

// ─── Criar limiters com memória (fallback) ───────────────────────────────────

const initializeLimitersWithMemory = () => {
  defaultLimiterMiddleware = rateLimit({
    windowMs: appConfig.rateLimit.windowMs,
    max: appConfig.rateLimit.max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next, options) => {
      logger.warn({
        type: 'RATE_LIMIT_BLOCK',
        ip: req.ip,
        path: req.originalUrl,
        method: req.method,
        store: 'Memory',
      });

      return res.status(options.statusCode).json({
        status: 'fail',
        message: 'Muitas requisições. Tente novamente mais tarde.',
      });
    },
  });

  authLimiterMiddleware = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: appConfig.rateLimit.authMax,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    keyGenerator: (req) => `${req.ip}_${req.body?.email || 'unknown'}`,
    handler: (req, res, next, options) => {
      logger.error({
        type: 'SECURITY_AUTH_BLOCK',
        message: 'Bloqueio por múltiplas tentativas de login',
        ip: req.ip,
        path: req.originalUrl,
        userAgent: req.get('User-Agent'),
        store: 'Memory',
      });

      return res.status(options.statusCode).json({
        status: 'fail',
        message: 'Muitas tentativas de autenticação. Tente novamente em alguns minutos.',
      });
    },
  });

  logger.warn('[RateLimiter] Limiters com armazenamento em memória (fallback)');
};

// ─── Inicialização ───────────────────────────────────────────────────────────

// Verificar status atual do Redis
if (redis.status === 'ready') {
  // Redis já está pronto
  redisReady = true;
  initializeLimitersWithRedis();
} else {
  // Redis não está pronto, usar memória
  initializeLimitersWithMemory();
  // Monitorar para quando Redis ficar pronto
  setupRedisMonitoring();
}

// ─── Middlewares exportados ───────────────────────────────────────────────────

const defaultLimiter = (req, res, next) => {
  if (!defaultLimiterMiddleware) {
    logger.error('[RateLimiter] defaultLimiter não inicializado');
    return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
  defaultLimiterMiddleware(req, res, next);
};

const authLimiter = (req, res, next) => {
  if (!authLimiterMiddleware) {
    logger.error('[RateLimiter] authLimiter não inicializado');
    return res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
  authLimiterMiddleware(req, res, next);
};

// ─── Health check ───────────────────────────────────────────────────────

const getRateLimiterStatus = () => {
  return {
    redisReady,
    defaultLimiterActive: !!defaultLimiterMiddleware,
    authLimiterActive: !!authLimiterMiddleware,
    store: redisReady ? 'Redis' : 'Memory',
  };
};

module.exports = {
  defaultLimiter,
  authLimiter,
  getRateLimiterStatus,
};