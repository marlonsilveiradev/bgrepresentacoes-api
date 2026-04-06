/**
 * REPOSITORY: RefreshToken
 * Responsabilidade: Persistência de refresh tokens
 */

const logger = require('../config/logger');

class RefreshTokenRepository {
  /**
   * Constructor com injeção de dependência
   * @param {Object} RefreshTokenModel - O modelo Sequelize
   */
  constructor(RefreshTokenModel) {
    this.RefreshTokenModel = RefreshTokenModel;
  }

  /**
   * Criar novo refresh token
   */
  async create(userId, token) {
    try {
      if (!userId || !token) {
        throw new Error('userId e token são obrigatórios');
      }

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const refreshToken = await this.RefreshTokenModel.create({
        user_id: userId,
        token_hash: token,
        expires_at: expiresAt,
        revoked: false,
      });

      logger.info(
        { userId, tokenId: refreshToken.id },
        '[RefreshTokenRepository.create] Refresh token criado com sucesso'
      );

      return refreshToken;
    } catch (error) {
      logger.error(
        { userId, error: error.message },
        '[RefreshTokenRepository.create] Erro ao criar refresh token'
      );
      throw error;
    }
  }

  /**
   * Revogar todos os tokens de um usuário
   */
  async revokeAllForUser(userId) {
    try {
      await this.RefreshTokenModel.update(
        { revoked: true },
        { where: { user_id: userId } }
      );

      logger.info(
        { userId },
        '[RefreshTokenRepository.revokeAllForUser] Todos os refresh tokens revogados'
      );
    } catch (error) {
      logger.error(
        { userId, error: error.message },
        '[RefreshTokenRepository.revokeAllForUser] Erro ao revogar tokens'
      );
      throw error;
    }
  }

  /**
   * Buscar token válido e não revogado
   */
  async findByToken(token) {
  try {
    const { Op } = require('sequelize');
    const refreshToken = await this.RefreshTokenModel.findOne({
      where: {
        token_hash: token,
        revoked: false,
        expires_at: {
          [Op.gt]: new Date() // Garante que a data de expiração é maior que 'agora'
        }
      },
    });

    return refreshToken;
  } catch (error) {
    logger.error({ error: error.message }, '[RefreshTokenRepository.findByToken] Erro');
    throw error;
  }
}

  /**
   * Verificar se token expirou
   */
  async isTokenExpired(tokenId) {
    try {
      const refreshToken = await this.RefreshTokenModel.findByPk(tokenId);

      if (!refreshToken || refreshToken.revoked) {
        return true;
      }

      const now = new Date();
      return refreshToken.expires_at < now;
    } catch (error) {
      logger.error(
        { error: error.message },
        '[RefreshTokenRepository.isTokenExpired] Erro ao verificar expiração'
      );
      throw error;
    }
  }

  /**
   * Revogar token específico
   */
  async revokeToken(tokenId) {
    try {
      await this.RefreshTokenModel.update(
        { revoked: true },
        { where: { id: tokenId } }
      );

      logger.info(
        '[RefreshTokenRepository.revokeToken] Token revogado com sucesso'
      );
    } catch (error) {
      logger.error(
        { error: error.message },
        '[RefreshTokenRepository.revokeToken] Erro ao revogar token'
      );
      throw error;
    }
  }

  /**
   * Buscar token por ID
   */
  async findById(tokenId) {
    try {
      const refreshToken = await this.RefreshTokenModel.findByPk(tokenId);
      return refreshToken;
    } catch (error) {
      logger.error(
        { error: error.message, tokenId },
        '[RefreshTokenRepository.findById] Erro ao buscar token'
      );
      throw error;
    }
  }

  /**
   * Buscar todos os tokens não revogados de um usuário
   */
  async findAllActiveForUser(userId) {
    try {
      const tokens = await this.RefreshTokenModel.findAll({
        where: {
          user_id: userId,
          revoked: false,
        },
      });

      return tokens;
    } catch (error) {
      logger.error(
        { userId, error: error.message },
        '[RefreshTokenRepository.findAllActiveForUser] Erro ao buscar tokens'
      );
      throw error;
    }
  }
}

module.exports = RefreshTokenRepository;