const AppError = require('../utils/AppError');

const parseMultipartBody = (req, res, next) => {
  if (!req.body) return next();

  if (typeof req.body.data === 'string') {
    try {
      req.body = JSON.parse(req.body.data.trim());
    } catch (err) {
      return next(new AppError('O campo "data" deve ser um JSON válido.', 400));
    }
  }

  return next();
};

module.exports = parseMultipartBody;