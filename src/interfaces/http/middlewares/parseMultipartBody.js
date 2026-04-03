const AppError = require('../../../shared/utils/AppError');
const logger = require('../../../infrastructure/config/logger');

const parseMultipartBody = (req, res, next) => {
  console.log('🔍 parseMultipartBody executado');
  console.log('req.body antes do parse:', req.body);
  if (!req.body) return next();

  if (typeof req.body.data === 'string') {
    try {
      const parsedData = JSON.parse(req.body.data.trim());
      // Mescla os dados parseados no req.body
      Object.assign(req.body, parsedData);
      delete req.body.data; // remove o campo original
      console.log('✅ Dados parseados:', Object.keys(parsedData));
    } catch (err) {
      logger.error('❌ Erro ao fazer parse do JSON:', err.message);
      console.error('❌ Erro no parse:', err.message);
      return next(new AppError('O campo "data" deve ser um JSON válido.', 400));
    }
  } else {
    console.log('⚠️ req.body.data não é uma string:', typeof req.body.data);
  }
  console.log('req.body depois do parse:', req.body);
  return next();
};

module.exports = parseMultipartBody;