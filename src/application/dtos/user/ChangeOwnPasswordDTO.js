/**
 * DTO: Change Own Password
 * Para o próprio usuário alterar sua senha via perfil
 * Diferente de auth/change-password (que obriga no primeiro login)
 */

const AppError = require('../../../shared/utils/AppError');

class ChangeOwnPasswordDTO {
  constructor({ currentPassword, newPassword }) {
    this.currentPassword = currentPassword;
    this.newPassword = newPassword;
  }

  static validate(data) {
    if (!data.currentPassword) {
      throw new AppError('Senha atual é obrigatória', 422);
    }

    if (!data.newPassword) {
      throw new AppError('Nova senha é obrigatória', 422);
    }

    if (data.newPassword.length < 6) {
      throw new AppError('Nova senha deve ter pelo menos 6 caracteres', 422);
    }

    if (data.currentPassword === data.newPassword) {
      throw new AppError('Nova senha não pode ser igual à senha atual', 422);
    }

    return new ChangeOwnPasswordDTO(data);
  }
}

module.exports = ChangeOwnPasswordDTO;