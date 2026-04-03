const AppError = require('../../../shared/utils/AppError');
const logger = require('../../../infrastructure/config/logger');

const parseMultipartBody = (req, res, next) => {
  if (!req.body) return next();

  if (typeof req.body.data === 'string') {
    try {
      const parsedData = JSON.parse(req.body.data.trim());
      // Mescla os dados parseados no req.body
      Object.assign(req.body, parsedData);
      delete req.body.data; // remove o campo original
    } catch (err) {
      logger.error('❌ Erro ao fazer parse do JSON:', err.message);
      return next(new AppError('O campo "data" deve ser um JSON válido.', 400));
    }
  }

  return next();
};

module.exports = parseMultipartBody;