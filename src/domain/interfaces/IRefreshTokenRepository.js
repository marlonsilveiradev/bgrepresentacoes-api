/**
 * INTERFACE: IRefreshTokenRepository
 * Contrato para repositório de refresh tokens
 */

class IRefreshTokenRepository {
  async create(userId, refreshToken) {
    throw new Error('Método create não implementado');
  }

  async findValidToken(userId, refreshToken) {
    throw new Error('Método findValidToken não implementado');
  }

  async revokeAllForUser(userId) {
    throw new Error('Método revokeAllForUser não implementado');
  }

  async rotate(userId, oldRefreshToken, newRefreshToken) {
    throw new Error('Método rotate não implementado');
  }
}

module.exports = IRefreshTokenRepository;