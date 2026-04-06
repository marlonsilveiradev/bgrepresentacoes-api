/**
 * DTO: Update User
 * Validação para atualização de usuário por admin
 * 
 * Campos permitidos (admin):
 * - name (via perfil)
 * - email
 * - role
 * - is_active
 * - cpf (via perfil)
 * - endereço (via perfil)
 * 
 * ⚠️ IMPORTANTE: Email e role são exclusivos de admin
 */

const AppError = require('../../../shared/utils/AppError');

class UpdateUserDTO {
  constructor({ email, role, is_active }) {
    this.email = email?.toLowerCase().trim();
    this.role = role;
    this.is_active = is_active;
  }

  static validate(data) {
    // ✅ REGRA: Pelo menos um campo deve ser fornecido
    const hasAnyField = Object.values(data).some(val => val !== undefined && val !== null);
    if (!hasAnyField) {
      throw new AppError('Informe pelo menos um campo para atualizar', 422);
    }

    // ✅ REGRA: Se email é fornecido, validar
    if (data.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        throw new AppError('E-mail inválido', 422);
      }
    }

    // ✅ REGRA: Se role é fornecido, validar
    if (data.role) {
      const validRoles = ['admin', 'user', 'partner'];
      if (!validRoles.includes(data.role)) {
        throw new AppError('Role deve ser "admin", "user" ou "partner"', 422);
      }
    }

    // ✅ REGRA: is_active deve ser boolean
    if (data.is_active !== undefined && typeof data.is_active !== 'boolean') {
      throw new AppError('is_active deve ser boolean', 422);
    }

    return new UpdateUserDTO(data);
  }
}

module.exports = UpdateUserDTO;