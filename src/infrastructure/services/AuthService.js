const { User } = require('../../infrastructure/repositories/models');
const { generateToken, generateRefreshToken, verifyRefreshToken } = require('../../shared/utils/auth');
const AppError = require('../../shared/utils/AppError');
const logger = require('../../infrastructure/config/logger');
const refreshTokenService = require('./RefreshTokenService');

class AuthService {
  async login(email, password) {
    const user = await this._findUserByEmail(email);
    this._validateUser(user, email);
    await this._validatePassword(user, password);

    const isFirstLogin = user.last_login_at === null;
    const tokenPayload = { sub: user.id, role: user.role };

    const token = generateToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    await refreshTokenService.revokeAllForUser(user.id);
    await refreshTokenService.create(user.id, refreshToken);

    if (!isFirstLogin) {
      await user.update({ last_login_at: new Date() }, { hooks: false });
    }

    logger.info(
      { userId: user.id, role: user.role, firstLogin: isFirstLogin },
      isFirstLogin ? 'Primeiro login — troca de senha obrigatória.' : 'Login realizado com sucesso.'
    );

    return {
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      token,
      refreshToken,
      mustChangePassword: isFirstLogin,
    };
  }

  async changePassword(userId, currentPassword, newPassword) {
    const user = await this._findUserByIdWithPassword(userId);
    if (!user || !user.is_active) {
      throw new AppError('Usuário não encontrado ou inativo.', 404);
    }

    await this._validatePassword(user, currentPassword);
    await this._preventSamePassword(user, newPassword);

    const isFirstLogin = user.last_login_at === null;

    await user.update({
      password: newPassword,
      last_login_at: isFirstLogin ? new Date() : user.last_login_at,
    });

    await refreshTokenService.revokeAllForUser(userId);

    logger.info({ userId, firstLogin: isFirstLogin }, isFirstLogin
      ? 'Senha do primeiro login alterada. last_login_at definido.'
      : 'Senha alterada com sucesso.');

    return {
      message: isFirstLogin
        ? 'Senha alterada com sucesso. Bem-vindo ao sistema!'
        : 'Senha alterada com sucesso.',
    };
  }

  async refreshAccessToken(refreshToken) {
    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded.sub) throw new AppError('Token inválido.', 401);

    const storedToken = await refreshTokenService.findValidToken(decoded.sub, refreshToken);
    if (!storedToken) throw new AppError('Refresh token inválido ou expirado.', 401);

    const user = await User.findByPk(decoded.sub, { attributes: ['id', 'role', 'is_active'] });
    if (!user || !user.is_active) throw new AppError('Usuário inválido.', 401);

    const newToken = generateToken({ sub: user.id, role: user.role });
    const newRefreshToken = generateRefreshToken({ sub: user.id, role: user.role });

    await refreshTokenService.rotate(user.id, refreshToken, newRefreshToken);

    return { token: newToken, refreshToken: newRefreshToken };
  }

  // ========== Métodos privados ==========

  async _findUserByEmail(email) {
    if (!email) throw new AppError('E-mail é obrigatório.', 400);
    return await User.findOne({
      where: { email: email.toLowerCase().trim() },
      attributes: ['id', 'name', 'email', 'password', 'role', 'is_active', 'last_login_at'],
    });
  }

  async _findUserByIdWithPassword(userId) {
    return await User.findByPk(userId, {
      attributes: ['id', 'password', 'is_active', 'last_login_at'],
    });
  }

  _validateUser(user, email) {
    if (!user) {
      logger.warn({ email }, 'Tentativa de login com usuário inexistente');
      throw new AppError('E-mail ou senha incorretos.', 401);
    }
    if (!user.is_active) {
      throw new AppError('Conta desativada. Entre em contato com o administrador.', 403);
    }
  }

  async _validatePassword(user, password) {
    const passwordMatch = await user.checkPassword(password);
    if (!passwordMatch) {
      logger.warn({ userId: user.id }, 'Senha inválida');
      throw new AppError('E-mail ou senha incorretos.', 401);
    }
  }

  async _preventSamePassword(user, newPassword) {
    const isSamePassword = await user.checkPassword(newPassword);
    if (isSamePassword) {
      throw new AppError('A nova senha não pode ser igual à senha atual.', 400);
    }
  }
}

module.exports = new AuthService();