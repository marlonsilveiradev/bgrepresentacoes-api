/**
 * DTO: Create User
 * Validação de entrada para criação de usuário
 */

const AppError = require('../../../shared/utils/AppError');

class CreateUserDTO {
  constructor(data) {
    this.name = data.name?.trim();
    this.email = data.email?.toLowerCase().trim();
    this.role = data.role;

    // Campos Opcionais (Admin pode preencher agora ou deixar para depois)
    this.password = data.password; // Se não vier, o Use Case gera a temporária
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
    if (!data.name || !data.email || !data.role) {
      throw new AppError('Dados obrigatórios ausentes: nome, e-mail e role.', 422);
    }
    return new CreateUserDTO(data);
  }
}

module.exports = CreateUserDTO;