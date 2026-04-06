/**
 * USE CASE: Reactivate User
 */

const AppError = require('../../../shared/utils/AppError');
const CacheService = require('../../../infrastructure/services/CacheService');
const logger = require('../../../infrastructure/config/logger');

class ReactivateUserUseCase {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async execute(targetId, requesterId) {
    // ✅ Validar operação
    if (targetId === requesterId) {
      throw new AppError('Operação inválida sobre a própria conta.', 403);
    }

    // ✅ Buscar usuário
    const user = await this.userRepository.findById(targetId);
    if (!user) {
      throw new AppError('Usuário não encontrado.', 404);
    }

    // ✅ Validar se já está ativo
    if (user.is_active) {
      throw new AppError('Usuário já está ativo.', 409);
    }

    // ✅ Aplicar regra do domínio
    user.reactivate();

    // ✅ Persistir
    await this.userRepository.reactivate(targetId);

    // ✅ Limpar cache
    await this._invalidateCache(targetId);

    logger.info({ targetId, requesterId }, 'Usuário reativado por admin.');

    return {
      message: `Usuário "${user.name}" reativado com sucesso.`,
    };
  }

  async _invalidateCache(userId) {
    await CacheService.del(`users:${userId}`);
    await CacheService.delPattern('users:list:*');
  }
}

module.exports = ReactivateUserUseCase;