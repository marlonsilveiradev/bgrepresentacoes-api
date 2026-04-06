/**
 * REPOSITÓRIO: RefreshTokenRepository
 * Implementa IRefreshTokenRepository
 * Responsabilidade: Gerenciar refresh tokens
 */

const { RefreshToken } = require('./models');
const IRefreshTokenRepository = require('../../domain/interfaces/IRefreshTokenRepository');
const AppError = require('../../shared/utils/AppError');
const logger = require('../config/logger');

class RefreshTokenRepository extends IRefreshTokenRepository {
  /**
   * Criar novo refresh token
   */
  async create(userId, refreshToken) {
    try {
      const token = await RefreshToken.create({
        user_id: userId,
        token: refreshToken, // Já vem hashado do service
        expires_at: this._calculateExpirationDate(),
      });

      logger.info({ userId }, 'Refresh token criado');
      return token;
    } catch (error) {
      logger.error('[RefreshTokenRepository.create] Erro:', error.message);
      throw error;
    }
  }

  /**
   * Buscar token válido (não expirado, não revogado)
   */
  async findValidToken(userId, refreshToken) {
    try {
      const token = await RefreshToken.findOne({
        where: {
          user_id: userId,
          token: refreshToken,
          is_revoked: false,
          expires_at: { [require('sequelize').Op.gt]: new Date() },
        },
      });

      return token;
    } catch (error) {
      logger.error('[RefreshTokenRepository.findValidToken] Erro:', error.message);
      throw error;
    }
  }

  /**
   * Revogar todos os tokens de um usuário
   */
  async revokeAllForUser(userId) {
    try {
      await RefreshToken.update(
        { is_revoked: true },
        { where: { user_id: userId } }
      );

      logger.info({ userId }, 'Todos os refresh tokens revogados');
    } catch (error) {
      logger.error('[RefreshTokenRepository.revokeAllForUser] Erro:', error.message);
      throw error;
    }
  }

  /**
   * Rotacionar token (revogar antigo, criar novo)
   */
  async rotate(userId, oldRefreshToken, newRefreshToken) {
    try {
      // Revogar antigo
      await RefreshToken.update(
        { is_revoked: true },
        { where: { user_id: userId, token: oldRefreshToken } }
      );

      // Criar novo
      const token = await RefreshToken.create({
        user_id: userId,
        token: newRefreshToken,
        expires_at: this._calculateExpirationDate(),
      });

      logger.info({ userId }, 'Refresh token rotacionado');
      return token;
    } catch (error) {
      logger.error('[RefreshTokenRepository.rotate] Erro:', error.message);
      throw error;
    }
  }

  /**
   * Calcular data de expiração (7 dias)
   */
  _calculateExpirationDate() {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    return expiresAt;
  }
}

module.exports = RefreshTokenRepository;