const jwt = require('jsonwebtoken');
const config = require('../../infrastructure/config/config');
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
      throw new AppError('Token expirado. Faça login novamente.', 401, null, 'TOKEN_EXPIRED');
    }
    throw new AppError('Token inválido ou malformado.', 401, null, 'TOKEN_INVALID');
  }
};

const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, config.jwt.refreshSecret);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new AppError('Refresh token expirado.', 401);
    }
    throw new AppError('Refresh token inválido.', 401);
  }
};

// Não esqueça de adicionar ao module.exports!
module.exports = {
  generateToken,
  generateRefreshToken,
  verifyToken,
  verifyRefreshToken,
};