/**
 * RATE LIMITER: Enterprise-Grade (v2.1 - CORRIGIDO)
 * 
 * ✅ Cada limiter tem sua própria instância de RedisStore
 * ✅ Prefixos únicos para evitar colisão de chaves
 * ✅ Circuit breaker para Redis
 */

const rateLimit = require('express-rate-limit');
const { redis } = require('../../../infrastructure/config/redis');
const appConfig = require('../../../infrastructure/config/config');
const logger = require('../../../infrastructure/config/logger');

// ─── Configuração ───────────────────────────────────────────────────────────

const REDIS_CIRCUIT_BREAKER = {
  failureThreshold: 5,
  resetTimeout: 30000,
  failureCount: 0,
  isOpen: false,
};

const IP_WHITELIST = [
  '127.0.0.1',
  'localhost',
  '::1',
];

const IP_BLACKLIST = [];

// ─── Estado do RateLimiter ──────────────────────────────────────────────────

let redisReady = false;
let defaultLimiterMiddleware = null;
let authLimiterMiddleware = null;

// ─── Métricas ───────────────────────────────────────────────────────────────

const metrics = {
  totalRequests: 0,
  blockedRequests: 0,
  redisErrors: 0,
  startTime: Date.now(),

  record(type) {
    this.totalRequests++;
    if (type === 'blocked') {
      this.blockedRequests++;
    }
  },

  getStats() {
    const uptime = Date.now() - this.startTime;
    const blockRate = this.totalRequests > 0 
      ? ((this.blockedRequests / this.totalRequests) * 100).toFixed(2)
      : 0;

    return {
      totalRequests: this.totalRequests,
      blockedRequests: this.blockedRequests,
      blockRate: `${blockRate}%`,
      redisErrors: this.redisErrors,
      uptime: `${(uptime / 1000).toFixed(0)}s`,
      circuitBreakerOpen: REDIS_CIRCUIT_BREAKER.isOpen,
      redisReady,
    };
  },
};

// ─── Circuit Breaker para Redis ──────────────────────────────────────────────

const recordRedisError = () => {
  REDIS_CIRCUIT_BREAKER.failureCount++;
  metrics.redisErrors++;

  if (REDIS_CIRCUIT_BREAKER.failureCount >= REDIS_CIRCUIT_BREAKER.failureThreshold) {
    REDIS_CIRCUIT_BREAKER.isOpen = true;
    logger.warn('[RateLimiter] Circuit breaker ABERTO - muitas falhas de Redis');

    setTimeout(() => {
      REDIS_CIRCUIT_BREAKER.failureCount = 0;
      REDIS_CIRCUIT_BREAKER.isOpen = false;
      logger.info('[RateLimiter] Circuit breaker FECHADO - tentando reconectar');
    }, REDIS_CIRCUIT_BREAKER.resetTimeout);
  }
};

const recordRedisSuccess = () => {
  REDIS_CIRCUIT_BREAKER.failureCount = 0;
};

// ─── Verificar IP Whitelist/Blacklist ────────────────────────────────────────

const isIPWhitelisted = (ip) => IP_WHITELIST.includes(ip);
const isIPBlacklisted = (ip) => IP_BLACKLIST.includes(ip);

const getClientIP = (req) => {
  return (
    req.headers['x-forwarded-for']?.split(',')[0].trim() ||
    req.headers['x-real-ip'] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.ip
  );
};

// ─── Criar limiters com memória ──────────────────────────────────────────────

const initializeLimitersWithMemory = () => {
  defaultLimiterMiddleware = rateLimit({
    windowMs: appConfig.rateLimit.windowMs || 15 * 60 * 1000,
    max: appConfig.rateLimit.max || 100,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => isIPWhitelisted(getClientIP(req)),
    keyGenerator: (req) => getClientIP(req),
    handler: (req, res, next, options) => {
      const ip = getClientIP(req);
      metrics.record('blocked');

      logger.warn({
        type: 'RATE_LIMIT_BLOCK',
        ip,
        path: req.originalUrl,
        method: req.method,
        store: 'Memory',
      });

      return res.status(options.statusCode)
        .set('Retry-After', Math.ceil(options.windowMs / 1000))
        .json({
          status: 'fail',
          message: 'Muitas requisições. Tente novamente mais tarde.',
          retryAfter: Math.ceil(options.windowMs / 1000),
        });
    },
  });

  authLimiterMiddleware = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: appConfig.rateLimit.authMax || 5,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    keyGenerator: (req) => `${getClientIP(req)}_${req.body?.email || 'unknown'}`,
    skip: (req) => isIPWhitelisted(getClientIP(req)),
    handler: (req, res, next, options) => {
      const ip = getClientIP(req);
      metrics.record('blocked');

      logger.error({
        type: 'SECURITY_AUTH_BLOCK',
        message: 'Bloqueio por múltiplas tentativas de login',
        ip,
        email: req.body?.email,
        userAgent: req.get('User-Agent'),
        store: 'Memory',
      });

      if (!IP_BLACKLIST.includes(ip)) {
        IP_BLACKLIST.push(ip);
        setTimeout(() => {
          const index = IP_BLACKLIST.indexOf(ip);
          if (index > -1) IP_BLACKLIST.splice(index, 1);
        }, 60 * 60 * 1000);
      }

      return res.status(options.statusCode)
        .set('Retry-After', Math.ceil(options.windowMs / 1000))
        .json({
          status: 'fail',
          message: 'Muitas tentativas de autenticação. Tente novamente em alguns minutos.',
          retryAfter: Math.ceil(options.windowMs / 1000),
        });
    },
  });

  logger.warn('[RateLimiter] Usando armazenamento em memória');
};

// ─── Tentar inicializar com Redis (CORRIGIDO) ───────────────────────────────

const tryInitializeRedisStore = async () => {
  try {
    // ✅ VERIFICAÇÃO 1: Circuit breaker aberto?
    if (REDIS_CIRCUIT_BREAKER.isOpen) {
      logger.warn('[RateLimiter] Circuit breaker aberto, usando memória');
      return false;
    }

    // ✅ VERIFICAÇÃO 2: Redis está pronto?
    if (redis.status !== 'ready') {
      logger.warn('[RateLimiter] Redis não pronto, mantendo memória');
      return false;
    }

    // ✅ VERIFICAÇÃO 3: Importar RedisStore
    let RedisStore;
    try {
      RedisStore = require('rate-limit-redis');
      if (RedisStore.default) {
        RedisStore = RedisStore.default;
      }
    } catch (err) {
      recordRedisError();
      logger.warn('[RateLimiter] Módulo rate-limit-redis não disponível:', err.message);
      return false;
    }

    // ✅ VERIFICAÇÃO 4: RedisStore é válido?
    if (!RedisStore || typeof RedisStore !== 'function') {
      recordRedisError();
      logger.warn('[RateLimiter] RedisStore não é um construtor válido');
      return false;
    }

    // ✅ TESTE DE CONEXÃO
    await redis.ping();
    recordRedisSuccess();

    // ✅ CRIAR STORE PARA defaultLimiter (INSTÂNCIA 1)
    const defaultRedisStore = new RedisStore({
      sendCommand: (...args) => redis.call(...args),
      prefix: 'rl:default:',  // ✅ PREFIXO ÚNICO 1
    });

    // ✅ CRIAR STORE PARA authLimiter (INSTÂNCIA 2)
    const authRedisStore = new RedisStore({
      sendCommand: (...args) => redis.call(...args),
      prefix: 'rl:auth:',  // ✅ PREFIXO ÚNICO 2
    });

    // ✅ CRIAR defaultLimiter COM SUA INSTÂNCIA
    defaultLimiterMiddleware = rateLimit({
      windowMs: appConfig.rateLimit.windowMs || 15 * 60 * 1000,
      max: appConfig.rateLimit.max || 100,
      standardHeaders: true,
      legacyHeaders: false,
      store: defaultRedisStore,  // ✅ Sua própria instância
      skip: (req) => isIPWhitelisted(getClientIP(req)),
      keyGenerator: (req) => getClientIP(req),
      handler: (req, res, next, options) => {
        const ip = getClientIP(req);
        metrics.record('blocked');

        logger.warn({
          type: 'RATE_LIMIT_BLOCK',
          ip,
          path: req.originalUrl,
          method: req.method,
          store: 'Redis',
        });

        return res.status(options.statusCode)
          .set('Retry-After', Math.ceil(options.windowMs / 1000))
          .json({
            status: 'fail',
            message: 'Muitas requisições. Tente novamente mais tarde.',
            retryAfter: Math.ceil(options.windowMs / 1000),
          });
      },
    });

    // ✅ CRIAR authLimiter COM SUA INSTÂNCIA
    authLimiterMiddleware = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: appConfig.rateLimit.authMax || 5,
      standardHeaders: true,
      legacyHeaders: false,
      store: authRedisStore,  // ✅ Sua própria instância
      skipSuccessfulRequests: true,
      keyGenerator: (req) => `${getClientIP(req)}_${req.body?.email || 'unknown'}`,
      skip: (req) => isIPWhitelisted(getClientIP(req)),
      handler: (req, res, next, options) => {
        const ip = getClientIP(req);
        metrics.record('blocked');

        logger.error({
          type: 'SECURITY_AUTH_BLOCK',
          message: 'Bloqueio por múltiplas tentativas de login',
          ip,
          email: req.body?.email,
          userAgent: req.get('User-Agent'),
          store: 'Redis',
        });

        if (!IP_BLACKLIST.includes(ip)) {
          IP_BLACKLIST.push(ip);
          setTimeout(() => {
            const index = IP_BLACKLIST.indexOf(ip);
            if (index > -1) IP_BLACKLIST.splice(index, 1);
          }, 60 * 60 * 1000);
        }

        return res.status(options.statusCode)
          .set('Retry-After', Math.ceil(options.windowMs / 1000))
          .json({
            status: 'fail',
            message: 'Muitas tentativas de autenticação. Tente novamente em alguns minutos.',
            retryAfter: Math.ceil(options.windowMs / 1000),
          });
      },
    });

    logger.info('[RateLimiter] Store Redis ativado com sucesso (2 instâncias)');
    redisReady = true;
    return true;
  } catch (error) {
    recordRedisError();
    logger.warn('[RateLimiter] Erro ao inicializar Redis store:', error.message);
    return false;
  }
};

// ─── Monitorar Redis ─────────────────────────────────────────────────────────

redis.on('ready', async () => {
  if (!redisReady) {
    logger.info('[RateLimiter] Redis conectado, tentando ativar store Redis');
    await tryInitializeRedisStore();
  }
});

redis.on('error', (err) => {
  recordRedisError();
  if (redisReady) {
    logger.warn('[RateLimiter] Erro de Redis:', err.message);
    redisReady = false;
    initializeLimitersWithMemory();
  }
});

redis.on('close', () => {
  redisReady = false;
  logger.warn('[RateLimiter] Conexão com Redis fechada');
});

// ─── Inicialização ──────────────────────────────────────────────────────────

initializeLimitersWithMemory();

if (redis.status === 'ready') {
  tryInitializeRedisStore();
}

// ─── Middleware de Blacklist ────────────────────────────────────────────────

const blacklistMiddleware = (req, res, next) => {
  const ip = getClientIP(req);

  if (isIPBlacklisted(ip)) {
    logger.error('[RateLimiter] IP bloqueado (blacklist):', ip);
    return res.status(403).json({
      status: 'fail',
      message: 'Seu IP foi bloqueado. Entre em contato com o suporte.',
    });
  }

  next();
};

// ─── Middleware de Métricas ─────────────────────────────────────────────────

const metricsMiddleware = (req, res, next) => {
  metrics.record();
  next();
};

// ─── Middlewares exportados ─────────────────────────────────────────────────

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

// ─── Health check ───────────────────────────────────────────────────────────

const getRateLimiterStatus = () => {
  return {
    ...metrics.getStats(),
    ipWhitelist: IP_WHITELIST.length,
    ipBlacklist: IP_BLACKLIST.length,
  };
};

// ─── Admin: Gerenciar blacklist ──────────────────────────────────────────────

const adminBlacklist = {
  add: (ip) => {
    if (!IP_BLACKLIST.includes(ip)) {
      IP_BLACKLIST.push(ip);
      logger.warn('[RateLimiter] IP adicionado à blacklist:', ip);
    }
  },
  remove: (ip) => {
    const index = IP_BLACKLIST.indexOf(ip);
    if (index > -1) {
      IP_BLACKLIST.splice(index, 1);
      logger.info('[RateLimiter] IP removido da blacklist:', ip);
    }
  },
  list: () => IP_BLACKLIST,
};

module.exports = {
  defaultLimiter,
  authLimiter,
  blacklistMiddleware,
  metricsMiddleware,
  getRateLimiterStatus,
  adminBlacklist,
};