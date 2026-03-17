require('dotenv').config();

module.exports = {
  env:          process.env.NODE_ENV  || 'development',
  port:         parseInt(process.env.PORT, 10) || 3000,
  appName:      process.env.APP_NAME  || 'BG Representações API',
  appUrl:       process.env.APP_URL   || 'http://localhost:3000',
  isProduction: process.env.NODE_ENV  === 'production',
  isTest:       process.env.NODE_ENV  === 'test',

  jwt: {
    secret:           process.env.JWT_SECRET,
    expiresIn:        process.env.JWT_EXPIRES_IN        || '8h',
    refreshSecret:    process.env.JWT_REFRESH_SECRET,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  bcrypt: {
    rounds: parseInt(process.env.BCRYPT_ROUNDS, 10) || 12,
  },

  cloudinary: {
    cloudName:      process.env.CLOUDINARY_CLOUD_NAME,
    apiKey:         process.env.CLOUDINARY_API_KEY,
    apiSecret:      process.env.CLOUDINARY_API_SECRET,
    folder:         process.env.CLOUDINARY_ASSET_FOLDER        || 'vale_alimentacao',
    signedUrlExpires: parseInt(process.env.CLOUDINARY_SIGNED_URL_EXPIRES, 10) || 3600,
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10)    || 15 * 60 * 1000,
    max:      parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10)  || 200,
    authMax:  parseInt(process.env.AUTH_RATE_LIMIT_MAX, 10)      || 10,
  },

  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
  },

  smtp: {
    host:   process.env.SMTP_HOST,
    port:   parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    user:   process.env.SMTP_USER,
    pass:   process.env.SMTP_PASS,
    alertFrom: process.env.ALERT_EMAIL_FROM,
    alertTo:   process.env.ALERT_EMAIL_TO,
  },

  log: {
    level:              process.env.LOG_LEVEL               || 'info',
    slowRequestThreshold: parseInt(process.env.SLOW_REQUEST_THRESHOLD, 10) || 2000,
    errorRateThreshold:   parseInt(process.env.ERROR_RATE_THRESHOLD, 10)   || 10,
  },

  upload: {
    maxFileSize:  3 * 1024 * 1024, // 3MB
    allowedTypes: ['image/jpeg', 'image/png', 'application/pdf'],
  },

  admin: {
    name:     process.env.ADMIN_DEFAULT_NAME,
    email:    process.env.ADMIN_DEFAULT_EMAIL,
    password: process.env.ADMIN_DEFAULT_PASSWORD,
  },

  roles: {
    ADMIN:   'admin',
    USER:    'user',
    PARTNER: 'partner',
  },

  flagStatus: {
    PENDING:  'pending',
    ANALYSIS: 'analysis',
    APPROVED: 'approved',
  },

  saleStatus: {
    PENDING:   'pending',
    ANALYSIS:  'analysis',
    APPROVED:  'approved',
    CANCELLED: 'cancelled',
  },

  benefitType: {
    FOOD: 'food',
    MEAL: 'meal',
    BOTH: 'both',
  },

  flagOrigin: {
    PLAN:       'plan',
    INDIVIDUAL: 'individual',
    UPGRADE:    'upgrade',
  },
};
