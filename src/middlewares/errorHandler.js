const logger = require('../config/logger');

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Erro interno do servidor';
  let isOperational = err.isOperational || false;

  // --- TRATAMENTO DE ERROS DO SEQUELIZE / POSTGRES ---

  // 1. Tratamento Genérico de ENUM (Seguro)
  if (err.name === 'SequelizeDatabaseError' && err.message.includes('invalid input value for enum')) {
    statusCode = 400;
    isOperational = true;
    
    let fieldName = 'um dos campos preenchidos';

    try {
      // Usamos um try/catch interno aqui para que, se o split falhar, 
      // o erro 500 não aconteça e o sistema siga com a mensagem genérica.
      const parts = err.message.split('enum_');
      if (parts && parts.length > 1) {
        fieldName = parts[1].split(':')[0].split(' ')[0].replace(/_/g, ' ');
      }
    } catch (e) {
      // Se falhar a extração, mantemos o fieldName como 'um dos campos'
    }

    message = `Valor inválido para o ${fieldName}. Verifique a ortografia ou as opções disponíveis.`;
  }

  // 2. Erros de Validação do Sequelize (Campos obrigatórios, Formatos)
  if (err.name === 'SequelizeValidationError') {
    statusCode = 400;
    message = err.errors.map(e => e.message).join('. ');
    isOperational = true;
  }

  // 3. Erros de Duplicidade (Unique Constraint)
  if (err.name === 'SequelizeUniqueConstraintError') {
    statusCode = 409;
    const field = err.errors[0].path.replace(/_/g, ' ').toUpperCase();
    message = `O dado informado para o campo ${field} já está em uso.`;
    isOperational = true;
  }

  // 3.1 Erro de chave estrangeira (Foreign Key)
if (err.name === 'SequelizeForeignKeyConstraintError') {
  statusCode = 422;
  const field = err.index ? err.index.replace(/_/g, ' ') : 'relacionamento';
  message = `Valor inválido para o campo ${field}. Verifique se o registro relacionado existe.`;
  isOperational = true;
}

  // 4. Erro de Sintaxe de UUID
  if (err.name === 'SequelizeDatabaseError' && err.message.includes('invalid input syntax for type uuid')) {
    statusCode = 400;
    message = 'O ID fornecido possui um formato inválido (UUID mal-formado).';
    isOperational = true;
  }

  // 5. Erros de Validação do YUP (Frontend/Request)
  if (err.name === 'ValidationError') {
    statusCode = 400;
    // O Yup retorna um array 'errors' com todas as mensagens de falha
    message = err.errors.join('. '); 
    isOperational = true;
  }

  // --- RESPOSTA FINAL ---

  if (isOperational || err.name === 'AppError') {
    return res.status(statusCode).json({
      status: 'fail',
      message: message
    });
  }

  // Se for erro 500 real (Bug), logamos no terminal com o logger
  logger.error({
    name: err.name,
    message: err.message,
    stack: err.stack,
    path: req.path
  });

  return res.status(500).json({
    status: 'error',
    message: 'Algo deu muito errado internamente!'
  });
};

module.exports = errorHandler;