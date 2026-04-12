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
  constructor(data) {
    this.name = data.name?.trim();
    this.email = data.email?.toLowerCase().trim();
    this.role = data.role;
    this.is_active = data.is_active;
    this.password = data.password;
    this.cpf = data.cpf;

    // Campos de Endereço
    this.address_street = data.address_street?.trim();
    this.address_number = data.address_number?.trim();
    this.address_complement = data.address_complement?.trim();
    this.address_neighborhood = data.address_neighborhood?.trim();
    this.address_city = data.address_city?.trim();
    this.address_state = data.address_state?.toUpperCase(); // Garante padrão UF (SP, RJ...)
    this.address_zip = data.address_zip?.trim();
  }

  static validate(data) {
    // Validação de objeto vazio
    const hasAnyField = Object.entries(data).some(([key, val]) => 
      val !== undefined && val !== null && val !== ''
    );
    
    if (!hasAnyField) {
      throw new AppError('Informe pelo menos um campo para atualizar', 422);
    }

    return new UpdateUserDTO(data);
  }
}

module.exports = UpdateUserDTO;