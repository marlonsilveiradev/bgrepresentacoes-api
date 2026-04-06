/**
 * DTO: Resposta de Autenticação
 * Formato padrão de resposta HTTP para auth
 */

class AuthResponseDTO {
  constructor({
    user,
    token,
    refreshToken,
    mustChangePassword = false,
  }) {
    this.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    this.token = token;
    this.refreshToken = refreshToken;
    this.mustChangePassword = mustChangePassword;
  }

  static toLoginResponse(user, token, refreshToken, isFirstLogin) {
    return new AuthResponseDTO({
      user,
      token,
      refreshToken,
      mustChangePassword: isFirstLogin,
    });
  }

  static toRefreshResponse(token, refreshToken) {
    return {
      token,
      refreshToken,
    };
  }
}

module.exports = AuthResponseDTO;