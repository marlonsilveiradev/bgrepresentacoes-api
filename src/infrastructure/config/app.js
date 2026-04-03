require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const pinoHttp = require('pino-http');
const swaggerUi = require('swagger-ui-express');
const hpp = require('hpp');
const basicAuth = require('express-basic-auth');

const logger = require('./logger');
const swaggerSpec = require('./swagger');
const routes = require('../../interfaces/http/routes');
const errorHandler = require('../../interfaces/http/middlewares/errorHandler');
const { defaultLimiter } = require('../../interfaces/http/middlewares/rateLimiter');

const app = express();
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.set('trust proxy', 1);

// Middlewares de Segurança e Performance
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(hpp());
app.use(cors({
  origin: (incomingOrigin, callback) => {
    const allowedList = (process.env.CORS_ORIGIN || 'http://localhost:3001')
      .split(',')
      .map(o => o.trim());

    // Permite requisições sem origin (Postman, mobile apps, etc.)
    if (!incomingOrigin) return callback(null, true);

    if (allowedList.includes(incomingOrigin)) {
      return callback(null, true);
    }

    logger.warn({
      type: 'CORS_BLOCK',
      origin: incomingOrigin,
    });
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(compression());
app.use(pinoHttp({ logger }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
// Rate Limiting e Documentação
app.use(defaultLimiter);
const isSwaggerEnabled = process.env.SWAGGER_ENABLED === 'true';

if (isSwaggerEnabled && process.env.SWAGGER_PASSWORD) {
  app.use(
    '/api-docs',
    basicAuth({
      users: {
        admin: process.env.SWAGGER_PASSWORD,
      },
      challenge: true,
    }),
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec)
  );
}

// Rotas da API
app.use('/api/v1', routes);

// Tratamento de Erros (Sempre por último)
app.use((req, res) => {
  res.status(404).json({ status: 'fail', message: `Rota ${req.originalUrl} não encontrada.` });
});

app.use(errorHandler);

module.exports = app;