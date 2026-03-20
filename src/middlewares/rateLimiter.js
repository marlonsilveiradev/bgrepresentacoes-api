const rateLimit = require('express-rate-limit');
const appConfig = require('../config/config');
const logger = require('../config/logger');

const defaultLimiter = rateLimit({
  windowMs: appConfig.rateLimit.windowMs,
  max: appConfig.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  handler: (req, res, next, options) => {
    logger.error({
      type: 'RATE_LIMIT_BLOCK',
      message: 'Excesso de requisições globais',
      ip: req.ip,
      path: req.path,
      method: req.method
    });

    res.status(options.statusCode).json({ 
      error: 'Muitas requisições. Tente novamente mais tarde.' 
    });
  },
});

const authLimiter = rateLimit({
  windowMs: appConfig.rateLimit.windowMs,
  max: appConfig.rateLimit.authMax,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    // Este log específico disparará o e-mail de "Aviso de Segurança"
    logger.error({
      type: 'SECURITY_AUTH_BLOCK',
      message: 'Bloqueio por múltiplas tentativas de login',
      ip: req.ip,
      path: req.path,
      userAgent: req.get('User-Agent')
    });

    res.status(options.statusCode).json({ 
      error: 'Muitas tentativas de autenticação. Tente novamente mais tarde.' 
    });
  },
});

module.exports = { defaultLimiter, authLimiter };
