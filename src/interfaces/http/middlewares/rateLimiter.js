const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const { redis, waitForRedis } = require('../../../infrastructure/config/redis');
const appConfig = require('../../../infrastructure/config/config');
const logger = require('../../../infrastructure/config/logger');

let defaultLimiterMiddleware = null;
let authLimiterMiddleware = null;

// Inicialização assíncrona dos stores
const initLimiters = async () => {
  try {
    await waitForRedis(); // aguarda conexão
    const redisStore = new RedisStore({
      sendCommand: (...args) => redis.call(...args),
      prefix: 'rl:',
    });
    logger.info('Rate limit store Redis ativado');

    // Cria os limiters com o store Redis
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
          method: req.method
        });
        return res.status(options.statusCode).json({
          status: 'fail',
          message: 'Muitas requisições. Tente novamente mais tarde.'
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
          userAgent: req.get('User-Agent')
        });
        return res.status(options.statusCode).json({
          status: 'fail',
          message: 'Muitas tentativas de autenticação. Tente novamente em alguns minutos.'
        });
      },
    });
  } catch (err) {
    logger.warn('Redis indisponível, usando store em memória (não distribuído)');
    // Fallback para store em memória
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
          method: req.method
        });
        return res.status(options.statusCode).json({
          status: 'fail',
          message: 'Muitas requisições. Tente novamente mais tarde.'
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
          userAgent: req.get('User-Agent')
        });
        return res.status(options.statusCode).json({
          status: 'fail',
          message: 'Muitas tentativas de autenticação. Tente novamente em alguns minutos.'
        });
      },
    });
  }
};

// Inicia a inicialização (não bloqueia o servidor, pois os limiters serão usados apenas em requisições)
initLimiters();

let initPromise = initLimiters();

const defaultLimiter = (req, res, next) => {
  initPromise.then(() => defaultLimiterMiddleware(req, res, next))
    .catch(() => defaultLimiterMiddleware(req, res, next));
};

const authLimiter = (req, res, next) => {
  initPromise.then(() => authLimiterMiddleware(req, res, next))
    .catch(() => authLimiterMiddleware(req, res, next));
};

module.exports = { defaultLimiter, authLimiter };