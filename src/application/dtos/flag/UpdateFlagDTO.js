/**
 * DTO: Data Transfer Object para ATUALIZAR Flag
 * Campos opcionais (partial update)
 */

const AppError = require('../../../shared/utils/AppError')

class UpdateFlagDTO {
  constructor({ name, description, price }) {
    this.name = name;
    this.description = description;
    this.price = price;
  }

  /**
   * Validar estrutura (campos são opcionais)
   */
  static validate(data) {
    const dto = new UpdateFlagDTO(data);

    if (dto.name && typeof dto.name !== 'string') {
      throw new AppError('Nome deve ser string');
    }

    if (dto.price && (typeof dto.price !== 'number' || dto.price <= 0)) {
      throw new AppError('Preço deve ser número > 0');
    }

    return dto;
  }
}

module.exports = UpdateFlagDTO;