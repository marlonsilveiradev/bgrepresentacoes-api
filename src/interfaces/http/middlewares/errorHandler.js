const logger = require('../../../infrastructure/config/logger');

const errorHandler = (err, req, res, next) => {
  // 1. AppError (ERROS CONTROLADOS)
  if (err.name === 'AppError') {
  return res.status(err.statusCode).json({
    status: 'fail',
    message: err.message,
    ...(err.code && { code: err.code }),
    ...(err.details && { details: err.details }),
  });
}

  let statusCode = 500;
  let message = 'Erro interno do servidor';
  let isOperational = false;

  // --- SEQUELIZE / DATABASE ERRORS ---

  // ENUM inválido
  if (err.name === 'SequelizeDatabaseError' && err.message.includes('invalid input value for enum')) {
    statusCode = 400;
    isOperational = true;

    let fieldName = 'um dos campos';

    try {
      const parts = err.message.split('enum_');
      if (parts && parts.length > 1) {
        fieldName = parts[1].split(':')[0].split(' ')[0].replaceAll('_', ' ');
      }
    } catch (_) {}

    message = `Valor inválido para ${fieldName}.`;
  }

  // Validação Sequelize
  if (err.name === 'SequelizeValidationError') {
    statusCode = 400;
    message = err.errors.map(e => e.message).join('. ');
    isOperational = true;
  }

  // Unique
  if (err.name === 'SequelizeUniqueConstraintError') {
    statusCode = 409;
    const field = err.errors[0].path.replaceAll('_', ' ').toUpperCase();
    message = `O campo ${field} já está em uso.`;
    isOperational = true;
  }

  // Foreign Key
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    statusCode = 422;
    const field = err.index ? err.index.replaceAll('_', ' ') : 'relacionamento';
    message = `Valor inválido para ${field}.`;
    isOperational = true;
  }

  // UUID inválido
  if (err.name === 'SequelizeDatabaseError' && err.message.includes('invalid input syntax for type uuid')) {
    statusCode = 400;
    message = 'ID inválido.';
    isOperational = true;
  }

  // YUP
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = err.errors.join('. ');
    isOperational = true;
  }

  // 2. ERROS OPERACIONAIS
  if (isOperational) {
  return res.status(statusCode).json({
    status: 'fail',
    message,
    ...(err.details && { details: err.details }),
  });
}

  // 3. ERRO REAL (BUG)
  logger.error({
    name: err.name,
    message: err.message,
    stack: err.stack,
    path: req.originalUrl,
    method: req.method,
  });

  return res.status(500).json({
    status: 'error',
    message: 'Algo deu muito errado internamente!',
  });
};

module.exports = errorHandler;