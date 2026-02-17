/**
 * MIDDLEWARES DE SEGURANÇA
 */

const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

/**
 * Helmet
 */
const helmetConfig = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", 'data:', 'https:']
        }
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    }
});

/**
 * CORS
 */
const corsConfig = cors({
    origin: function (origin, callback) {
        const allowedOrigins = [
            'http://localhost:3000',
            'http://localhost:3001',
            'https://seu-dominio.com.br'
        ];

        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Não permitido pelo CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 86400
});

/**
 * Rate Limit geral
 */
const generalRateLimit = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message: {
        success: false,
        error: 'Muitas requisições. Tente novamente em 15 minutos.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

/**
 * Rate Limit para cadastro
 */
const registrationRateLimit = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    message: {
        success: false,
        error: 'Limite de cadastros excedido. Tente novamente em 1 hora.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false
});

/**
 * Sanitização de input
 */
const sanitizeInput = (req, res, next) => {
    const sanitizeString = (str) => {
        if (typeof str !== 'string') return str;
        str = str.replace(/<[^>]*>/g, '');
        str = str.replace(/[<>"%;()&+]/g, '');
        str = str.trim();
        return str;
    };

    const sanitizeObject = (obj) => {
        if (typeof obj !== 'object' || obj === null) {
            return sanitizeString(obj);
        }

        if (Array.isArray(obj)) {
            return obj.map(sanitizeObject);
        }

        const sanitized = {};
        for (const key in obj) {
            sanitized[key] = sanitizeObject(obj[key]);
        }
        return sanitized;
    };

    if (req.body) {
        req.body = sanitizeObject(req.body);
    }

    if (req.query) {
        req.query = sanitizeObject(req.query);
    }

    next();
};

/**
 * Tratamento de erros de segurança
 */
const handleSecurityError = (err, req, res, next) => {
    if (err.message === 'Não permitido pelo CORS') {
        return res.status(403).json({
            success: false,
            error: 'Acesso negado: origem não autorizada'
        });
    }

    if (err.name === 'UnauthorizedError') {
        return res.status(401).json({
            success: false,
            error: 'Não autorizado'
        });
    }

    next(err);
};

module.exports = {
    helmetConfig,
    corsConfig,
    generalRateLimit,
    registrationRateLimit,
    sanitizeInput,
    handleSecurityError
};