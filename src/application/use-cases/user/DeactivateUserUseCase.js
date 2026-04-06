/**
 * USE CASE: Deactivate User
 */

const AppError = require('../../../shared/utils/AppError');
const CacheService = require('../../../infrastructure/services/CacheService');
const logger = require('../../../infrastructure/config/logger');

class DeactivateUserUseCase {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async execute(targetId, requesterId) {
    // ✅ Validar que não está desativando a si mesmo
    if (targetId === requesterId) {
      throw new AppError('Você não pode desativar a própria conta.', 403);
    }

    // ✅ Buscar usuário
    const user = await this.userRepository.findById(targetId);
    if (!user) {
      throw new AppError('Usuário não encontrado.', 404);
    }

    // ✅ Validar se já está desativado
    if (!user.is_active) {
      throw new AppError('Usuário já está desativado.', 409);
    }

    // ✅ Aplicar regra do domínio
    user.deactivate();

    // ✅ Persistir
    await this.userRepository.deactivate(targetId);

    // ✅ Limpar cache
    await this._invalidateCache(targetId);

    logger.info({ targetId, requesterId }, 'Usuário desativado por admin.');

    return {
      message: `Usuário "${user.name}" desativado com sucesso.`,
    };
  }

  async _invalidateCache(userId) {
    await CacheService.del(`users:${userId}`);
    await CacheService.delPattern('users:list:*');
  }
}

module.exports = DeactivateUserUseCase;