/**
 * USE CASE: Change Password
 * Responsabilidade: Alterar senha do usuário
 */

const AppError = require('../../../shared/utils/AppError');
const Auth = require('../../../domain/entities/Auth');
const logger = require('../../../infrastructure/config/logger');

class ChangePasswordUseCase {
  constructor(userRepository, refreshTokenRepository) {
    this.userRepository = userRepository;
    this.refreshTokenRepository = refreshTokenRepository;
  }

  async execute(userId, changePasswordDTO) {
    // ✅ PASSO 1: Buscar usuário
    const user = await this.userRepository.findByIdWithPassword(userId);

    if (!user || !user.is_active) {
      throw new AppError('Usuário não encontrado ou inativo.', 404);
    }

    // ✅ PASSO 2: Validar senha atual
    await this._validatePassword(user, changePasswordDTO.currentPassword);

    // ✅ PASSO 3: Validar força da nova senha
    Auth.validatePasswordStrength(changePasswordDTO.newPassword);

    // ✅ PASSO 4: Verificar se é primeira vez alterando senha
    const isFirstLogin = Auth.isFirstLogin(user.last_login_at);

    // ✅ PASSO 5: Atualizar senha (repository faz hash via hook)
    await this.userRepository.updatePassword(
      userId,
      changePasswordDTO.newPassword
    );

    // ✅ PASSO 6: Se for primeiro login, atualizar last_login_at
    if (isFirstLogin) {
      await this.userRepository.updateLastLogin(userId);
    }

    // ✅ PASSO 7: Revogar todos os tokens (força novo login)
    await this.refreshTokenRepository.revokeAllForUser(userId);

    // ✅ PASSO 8: Log
    logger.info(
      { userId, firstLogin: isFirstLogin },
      isFirstLogin
        ? 'Senha do primeiro login alterada. last_login_at definido.'
        : 'Senha alterada com sucesso.'
    );

    // ✅ PASSO 9: Retornar resposta
    return {
      message: isFirstLogin
        ? 'Senha alterada com sucesso. Bem-vindo ao sistema!'
        : 'Senha alterada com sucesso.',
    };
  }

  /**
   * Validar senha
   */
  async _validatePassword(user, password) {
    const passwordMatch = await user.checkPassword(password);

    if (!passwordMatch) {
      logger.warn({ userId: user.id }, 'Senha atual inválida');
      throw new AppError('Senha atual incorreta.', 401);
    }
  }
}

module.exports = ChangePasswordUseCase;