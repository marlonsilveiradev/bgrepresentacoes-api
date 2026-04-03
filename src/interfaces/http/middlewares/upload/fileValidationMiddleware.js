const AppError = require('../../../../shared/utils/AppError');

/**
 * Validador genérico de arquivos por campo
 * @param {Object} rules
 */
const validateFiles = (rules = {}) => {
  return (req, res, next) => {
    const files = req.files || {};

    for (const field in rules) {
      const config = rules[field];
      const fieldFiles = files[field] || [];

      // Obrigatoriedade
      if (config.required && fieldFiles.length === 0) {
        return next(new AppError(`${field} é obrigatório.`, 422));
      }

      // Limite máximo
      if (config.max && fieldFiles.length > config.max) {
        return next(new AppError(`Máximo de ${config.max} arquivos permitidos para ${field}.`, 422));
      }

      // Limite mínimo (opcional)
      if (config.min && fieldFiles.length < config.min) {
        return next(new AppError(`Mínimo de ${config.min} arquivos para ${field}.`, 422));
      }
    }

    next();
  };
};

module.exports = { validateFiles };