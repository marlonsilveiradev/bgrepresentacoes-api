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
    if (!data.currentPassword || !data.newPassword) {
      throw new AppError('Senha atual é obrigatória e nova senha são obrigatórias.', 422);
    }

    return new ChangeOwnPasswordDTO(data);
  }
}

module.exports = ChangeOwnPasswordDTO;