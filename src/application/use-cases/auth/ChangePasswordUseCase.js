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

    // ✅ PASSO 4: Verificar se ele estava sob a regra de troca obrigatória
    const wasRequired = user.must_change_password;

    // ✅ PASSO 5: Atualizar senha
    // (Como adicionamos o hook 'beforeUpdate' na Model, a senha será hasheada)
    await this.userRepository.update({
      id: userId,
      password: changePasswordDTO.newPassword,
      must_change_password: false, // Libera o acesso do usuário
      last_login_at: new Date()    // Define o primeiro login se for o caso
    });

    // ✅ PASSO 6: Revogar todos os tokens (força novo login)
    await this.refreshTokenRepository.revokeAllForUser(userId);

    // ✅ PASSO 7: Log
    logger.info(
      { userId, firstLogin: wasRequired },
      wasRequired ? 'Senha obrigatória alterada.' : 'Senha alterada com sucesso.'
    );

    // ✅ PASSO 8: Retornar resposta
    return {
      message: wasRequired 
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