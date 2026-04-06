/**
 * DTO: Change Password
 * Valida mudança de senha
 */

const AppError = require('../../../shared/utils/AppError');

class ChangePasswordDTO {
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

    if (data.newPassword.length < 8) {
      throw new AppError('Nova senha deve ter pelo menos 8 caracteres', 422);
    }

    if (data.currentPassword === data.newPassword) {
      throw new AppError('Nova senha não pode ser igual à senha atual', 422);
    }

    return new ChangePasswordDTO(data);
  }
}

module.exports = ChangePasswordDTO;