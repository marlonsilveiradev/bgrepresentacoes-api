/**
 * USE CASE: Refresh Access Token
 * Responsabilidade: Renovar token de acesso
 */

const AppError = require('../../../shared/utils/AppError');
const { generateToken, generateRefreshToken, verifyRefreshToken } = require('../../../shared/utils/auth');
const Auth = require('../../../domain/entities/Auth');
const logger = require('../../../infrastructure/config/logger');

class RefreshAccessTokenUseCase {
  constructor(userRepository, refreshTokenRepository) {
    this.userRepository = userRepository;
    this.refreshTokenRepository = refreshTokenRepository;
  }

  async execute(refreshTokenDTO) {
    // ✅ PASSO 1: Verificar assinatura do refresh token
    const decoded = verifyRefreshToken(refreshTokenDTO.refreshToken);

    if (!decoded.sub) {
      throw new AppError('Token inválido.', 401);
    }

    // ✅ PASSO 2: Validar token no BD (não revogado, não expirado)
    const storedToken = await this.refreshTokenRepository.findByToken(
      refreshTokenDTO.refreshToken
    );

    if (!storedToken) {
      logger.warn({ userId: decoded.sub }, 'Refresh token inválido ou expirado');
      throw new AppError('Refresh token inválido ou expirado.', 401);
    }

    // ✅ PASSO 3: Buscar usuário
    const user = await this.userRepository.findById(decoded.sub);

    if (!user || !user.is_active) {
      throw new AppError('Usuário inválido.', 401);
    }

    // ✅ PASSO 4: Gerar novos tokens
    const tokenPayload = Auth.buildTokenPayload(user);
    const newToken = generateToken(tokenPayload);
    const newRefreshToken = generateRefreshToken(tokenPayload);

    // ✅ PASSO 5: Rotacionar refresh token (revogar antigo, criar novo)
    await this.refreshTokenRepository.revokeToken(storedToken.id);
    await this.refreshTokenRepository.create(user.id, newRefreshToken);

    // ✅ PASSO 6: Log
    logger.info({ userId: user.id }, 'Token de acesso renovado');

    // ✅ PASSO 7: Retornar novos tokens
    return {
      token: newToken,
      refreshToken: newRefreshToken,
    };
  }
}

module.exports = RefreshAccessTokenUseCase;