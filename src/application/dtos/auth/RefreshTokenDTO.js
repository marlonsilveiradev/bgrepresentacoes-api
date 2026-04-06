/**
 * DTO: Refresh Token
 * Valida refresh token
 */

const AppError = require('../../../shared/utils/AppError');

class RefreshTokenDTO {
  constructor({ refreshToken }) {
    this.refreshToken = refreshToken;
  }

  static validate(data) {
    if (!data.refreshToken) {
      throw new AppError('Refresh token é obrigatório', 422);
    }

    return new RefreshTokenDTO(data);
  }
}

module.exports = RefreshTokenDTO;