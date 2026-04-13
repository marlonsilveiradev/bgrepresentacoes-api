const AppError = require('../../../shared/utils/AppError');
const { ROLES } = require('../../../shared/constants/roles');

/**
 * Escrita em planos (criação, atualização, flags, preço, ativação) — apenas ADMIN.
 * Reforço além do `authorize('admin')` nas rotas (defense in depth).
 */
function assertPlanAdmin(requester) {
  if (!requester || requester.role !== ROLES.ADMIN) {
    throw new AppError(
      'Apenas administradores podem criar ou alterar planos.',
      403,
      'PLAN_ADMIN_ONLY'
    );
  }
}

module.exports = { assertPlanAdmin };
