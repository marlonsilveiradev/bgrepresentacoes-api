/**
 * CONFIGURAÇÃO DA APLICAÇÃO EXPRESS
 */

const express = require('express');
const morgan = require('morgan');
const compression = require('compression');
require('dotenv').config();

// Importa middlewares de segurança
const {
    helmetConfig,
    corsConfig,
    generalRateLimit,
    sanitizeInput,
    handleSecurityError
} = require('./middlewares/security');

// Importa rotas
const authRoutes = require('./routes/authRoutes');
const clientRoutes = require('./routes/clientRoutes');
const planRoutes = require('./routes/planRoutes');
const flagRoutes = require('./routes/flagRoutes');
const reportRoutes = require('./routes/reportRoutes');

const app = express();

// ═══════════════════════════════════════════════════════════
// MIDDLEWARES GLOBAIS
// ═══════════════════════════════════════════════════════════

// Segurança
app.use(helmetConfig);
app.use(corsConfig);

// Compressão de respostas
app.use(compression());

// Logs (apenas em desenvolvimento)
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
app.use(generalRateLimit);

// Sanitização de input
app.use(sanitizeInput);

// ═══════════════════════════════════════════════════════════
// ROTAS
// ═══════════════════════════════════════════════════════════

// Rota raiz
app.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Card Flags System API',
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth',
            clients: '/api/clients',
            plans: '/api/plans',
            flags: '/api/flags',
            reports: '/api/reports',
            public: '/api/public/check-status'
        }
    });
});

// Health check
app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'API funcionando!',
        timestamp: new Date().toISOString()
    });
});

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/public', clientRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/flags', flagRoutes);
app.use('/api/reports', reportRoutes);

// ═══════════════════════════════════════════════════════════
// TRATAMENTO DE ERROS
// ═══════════════════════════════════════════════════════════

// Rota não encontrada
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Rota não encontrada'
    });
});

// Erros de segurança
app.use(handleSecurityError);

// Erro geral
app.use((err, req, res, next) => {
    console.error('Erro não tratado:', err);

    // Não expõe detalhes do erro em produção
    const message = process.env.NODE_ENV === 'development'
        ? err.message
        : 'Erro interno do servidor';

    res.status(err.status || 500).json({
        success: false,
        error: message
    });
});

module.exports = app;