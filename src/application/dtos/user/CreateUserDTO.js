/**
 * DTO: Create User
 * Validação de entrada para criação de usuário
 */

const AppError = require('../../../shared/utils/AppError');

class CreateUserDTO {
  constructor({ name, email, role }) {
    this.name = name;
    this.email = email?.toLowerCase().trim();
    this.role = role;
  }

  static validate(data) {
    if (!data.name || typeof data.name !== 'string') {
      throw new AppError('Nome é obrigatório e deve ser string', 422);
    }

    if (!data.email || typeof data.email !== 'string') {
      throw new AppError('E-mail é obrigatório', 422);
    }

    const validRoles = ['admin', 'user'];
    if (!data.role || !validRoles.includes(data.role)) {
      throw new AppError('Role deve ser "admin" ou "user"', 422);
    }

    return new CreateUserDTO(data);
  }
}

module.exports = CreateUserDTO;