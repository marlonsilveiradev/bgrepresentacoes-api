const AppError = require('../utils/AppError');

const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {

    if (!req.user) {
      return next(new AppError('Usuário não autenticado.', 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError('Você não tem permissão para executar esta ação.', 403)
      );
    }

    next();
  };
};

module.exports = authorizeRoles;