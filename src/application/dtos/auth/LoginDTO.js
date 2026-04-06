/**
 * DTO: Login
 * Valida credenciais de entrada
 */

const AppError = require('../../../shared/utils/AppError');

class LoginDTO {
  constructor({ email, password }) {
    this.email = email?.toLowerCase().trim();
    this.password = password;
  }

  static validate(data) {
    if (!data.email || typeof data.email !== 'string') {
      throw new AppError('E-mail é obrigatório e deve ser string', 422);
    }

    if (!data.password || typeof data.password !== 'string') {
      throw new AppError('Senha é obrigatória', 422);
    }

    if (data.password.length < 6) {
      throw new AppError('Senha deve ter pelo menos 6 caracteres', 422);
    }

    return new LoginDTO(data);
  }
}

module.exports = LoginDTO;