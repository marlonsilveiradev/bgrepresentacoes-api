require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const xss = require('xss-clean');
const mongoSanitize = require('express-mongo-sanitize');
const pinoHttp = require('pino-http');
const swaggerUi = require('swagger-ui-express');
const config = require('./config');

const logger = require('./logger');
const swaggerSpec = require('./swagger');
const routes = require('../routes');
const errorHandler = require('../middlewares/errorHandler');
const { defaultLimiter } = require('../middlewares/rateLimiter');

const app = express();

// Middlewares de Segurança e Performance
app.use(helmet());
app.use(xss());
app.use(mongoSanitize());
app.use(cors({
  origin: config.cors.origin,
  credentials: true
}));
app.use(compression());
app.use(pinoHttp({ logger }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate Limiting e Documentação
app.use(defaultLimiter);
if (process.env.NODE_ENV !== 'production') {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Rotas da API
app.use('/api/v1', routes);

// Tratamento de Erros (Sempre por último)
app.use((req, res) => {
  res.status(404).json({ status: 'fail', message: 'Rota não encontrada.' });
});

app.use(errorHandler);

module.exports = app;