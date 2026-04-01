const rateLimit = require('express-rate-limit');
const appConfig = require('../../../infrastructure/config/config');
const logger = require('../../../infrastructure/config/logger');

// 🌍 Limite global
const defaultLimiter = rateLimit({
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

// 🔐 Limite para login (CRÍTICO)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 🔒 15 minutos
  max: appConfig.rateLimit.authMax, // ex: 5 tentativas
  standardHeaders: true,
  legacyHeaders: false,

  skipSuccessfulRequests: true, // ✅ não conta login correto

  keyGenerator: (req) => {
    // 🔒 Combina IP + email para evitar bloqueios injustos
    return `${req.ip}_${req.body?.email || 'unknown'}`;
  },

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

module.exports = { defaultLimiter, authLimiter };