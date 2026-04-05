/**
 * DTO: Data Transfer Object para CRIAR Flag
 * 
 * Recebe dados "sujos" do HTTP, valida estrutura.
 * Separamos o que vem do HTTP (DTO) do que é regra de domínio (Entidade).
 */

const AppError = require('../../../shared/utils/AppError')

class CreateFlagDTO {
  constructor({ name, description, price }) {
    this.name = name;
    this.description = description;
    this.price = price;
  }

  /**
   * Validar estrutura básica (antes de chegar no domínio)
   * Yup/Joi faz isso no validator middleware
   */
  static validate(data) {
    if (!data.name || typeof data.name !== 'string') {
      throw new AppError('Nome obrigatório e deve ser string');
    }

    if (typeof data.price !== 'number' || data.price <= 0) {
      throw new AppError('Preço obrigatório e deve ser > 0');
    }

    return new CreateFlagDTO(data);
  }
}

module.exports = CreateFlagDTO;