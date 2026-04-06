/**
 * DTO: Update Profile
 * Validação para atualização de perfil do próprio usuário
 * 
 * Campos permitidos:
 * - name
 * - cpf
 * - address_street, address_number, address_complement
 * - address_neighborhood, address_city, address_state, address_zip
 */

const AppError = require('../../../shared/utils/AppError');

class UpdateProfileDTO {
  constructor({
    name,
    cpf,
    address_street,
    address_number,
    address_complement,
    address_neighborhood,
    address_city,
    address_state,
    address_zip,
  }) {
    this.name = name;
    this.cpf = cpf;
    this.address_street = address_street;
    this.address_number = address_number;
    this.address_complement = address_complement;
    this.address_neighborhood = address_neighborhood;
    this.address_city = address_city;
    this.address_state = address_state;
    this.address_zip = address_zip;
  }

  static validate(data) {
    // ✅ REGRA: Pelo menos um campo deve ser fornecido
    const hasAnyField = Object.values(data).some(val => val !== undefined && val !== null && val !== '');
    if (!hasAnyField) {
      throw new AppError('Informe pelo menos um campo para atualizar', 422);
    }

    // ✅ REGRA: Se name é fornecido, validar
    if (data.name !== undefined) {
      if (typeof data.name !== 'string') {
        throw new AppError('Nome deve ser string', 422);
      }
      if (data.name.trim().length === 0) {
        throw new AppError('Nome não pode estar vazio', 422);
      }
      if (data.name.length > 150) {
        throw new AppError('Nome não pode ter mais de 150 caracteres', 422);
      }
    }

    // ✅ REGRA: Se cpf é fornecido, validar formato (apenas números e hífen)
    if (data.cpf !== undefined) {
      if (data.cpf && !/^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(data.cpf)) {
        throw new AppError('CPF deve estar no formato XXX.XXX.XXX-XX', 422);
      }
    }

    // ✅ REGRA: Se endereço é fornecido, validar campo a campo
    if (data.address_street && typeof data.address_street !== 'string') {
      throw new AppError('Rua deve ser string', 422);
    }

    if (data.address_number && typeof data.address_number !== 'string') {
      throw new AppError('Número deve ser string', 422);
    }

    if (data.address_city && typeof data.address_city !== 'string') {
      throw new AppError('Cidade deve ser string', 422);
    }

    if (data.address_state && !/^[A-Z]{2}$/.test(data.address_state)) {
      throw new AppError('Estado deve ser sigla de 2 letras (ex: SP, RJ)', 422);
    }

    if (data.address_zip && !/^\d{5}-?\d{3}$/.test(data.address_zip)) {
      throw new AppError('CEP deve estar no formato XXXXX-XXX ou XXXXXXXX', 422);
    }

    return new UpdateProfileDTO(data);
  }
}

module.exports = UpdateProfileDTO;