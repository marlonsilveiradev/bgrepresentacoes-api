const rateLimit = require('express-rate-limit');
const appConfig = require('../config/config');

const defaultLimiter = rateLimit({
  windowMs: appConfig.rateLimit.windowMs,
  max: appConfig.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  message: { error: 'Muitas requisições. Tente novamente mais tarde.' },
});

const authLimiter = rateLimit({
  windowMs: appConfig.rateLimit.windowMs,
  max: appConfig.rateLimit.authMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas tentativas de autenticação. Tente novamente mais tarde.' },
});

module.exports = { defaultLimiter, authLimiter };
