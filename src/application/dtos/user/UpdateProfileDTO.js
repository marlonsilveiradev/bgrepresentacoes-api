/**
 * DTO: Update Profile
 * Responsável por transportar os dados de atualização do próprio usuário.
 */

const AppError = require('../../../shared/utils/AppError');

class UpdateProfileDTO {
  constructor(data) {
    this.name = data.name?.trim();
    this.cpf = data.cpf?.trim();
    
    // Campos de Endereço sanitizados
    this.address_street = data.address_street?.trim();
    this.address_number = data.address_number?.trim();
    this.address_complement = data.address_complement?.trim();
    this.address_neighborhood = data.address_neighborhood?.trim();
    this.address_city = data.address_city?.trim();
    this.address_state = data.address_state?.toUpperCase(); // Padroniza sigla (SP, RJ...)
    this.address_zip = data.address_zip?.trim();
  }

  static validate(data) {
    // Verifica se pelo menos um campo foi enviado para evitar requisições vazias
    const hasAnyField = Object.entries(data).some(([key, val]) => 
      val !== undefined && val !== null && val !== ''
    );
    
    if (!hasAnyField) {
      throw new AppError('Informe pelo menos um campo para atualizar', 422);
    }

    return new UpdateProfileDTO(data);
  }
}

module.exports = UpdateProfileDTO;