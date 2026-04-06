/**
 * USE CASE: Change Own Password
 * Permite ao próprio usuário alterar sua senha via perfil
 * Similar a auth/change-password, mas específico para self-service
 */

const AppError = require('../../../shared/utils/AppError');
const CacheService = require('../../../infrastructure/services/CacheService');
const logger = require('../../../infrastructure/config/logger');

class ChangeOwnPasswordUseCase {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async execute(userId, changeOwnPasswordDTO) {
    // ✅ PASSO 1: Buscar usuário (com password)
    const userModel = await this.userRepository.findByIdWithPassword(userId);

    if (!userModel || !userModel.is_active) {
      throw new AppError('Usuário não encontrado ou inativo.', 404);
    }

    // ✅ PASSO 2: Validar senha atual
    const passwordMatch = await userModel.checkPassword(changeOwnPasswordDTO.currentPassword);
    if (!passwordMatch) {
      logger.warn({ userId }, 'Tentativa de mudança de senha com senha atual incorreta');
      throw new AppError('Senha atual incorreta.', 401);
    }

    // ✅ PASSO 3: Atualizar senha (repository faz hash via hook)
    await this.userRepository.updatePassword(userId, changeOwnPasswordDTO.newPassword);

    // ✅ PASSO 4: Revogar todos os tokens (força novo login em outras sessões)
    // ⚠️ OPCIONAL: Se tiver RefreshTokenRepository, faça:
    // await this.refreshTokenRepository.revokeAllForUser(userId);

    // ✅ PASSO 5: Log
    logger.info({ userId }, 'Usuário alterou a própria senha via perfil.');

    // ✅ PASSO 6: Limpar cache
    await CacheService.del(`users:${userId}`);

    return {
      message: 'Senha alterada com sucesso.',
    };
  }
}

module.exports = ChangeOwnPasswordUseCase;