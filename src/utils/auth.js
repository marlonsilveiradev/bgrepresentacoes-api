const jwt = require('jsonwebtoken');
const config = require('../config/config');
const AppError = require('./AppError');

// Token de acesso (curta duração)
const generateToken = (payload) => {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
};

// Token de atualização (longa duração) - A FUNÇÃO QUE FALTAVA
const generateRefreshToken = (payload) => {
  return jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn,
  });
};

const verifyToken = (token) => {
  try {    
    return jwt.verify(token, config.jwt.secret);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      // Retornamos um erro customizado ou uma flag
      throw new AppError('Token expirado. Faça login novamente.', 401);
    }
    throw new AppError('Token inválido ou malformado.', 401);
  }
};

// Não esqueça de adicionar ao module.exports!
module.exports = {
  generateToken,
  generateRefreshToken,
  verifyToken,
};