/**
 * PRESENTER: AuthPresenter
 * Responsabilidade: Formatar respostas de autenticação
 */

const { AuthResponseDTO } = require('../../dtos/auth');

class AuthPresenter {
  /**
   * Formatar resposta de login
   */
  static toLoginResponse(user, token, refreshToken, mustChangePassword) {
    return new AuthResponseDTO({
      user,
      token,
      refreshToken,
      mustChangePassword,
    });
  }

  /**
   * Formatar resposta de refresh token
   */
  static toRefreshResponse(token, refreshToken) {
    return AuthResponseDTO.toRefreshResponse(token, refreshToken);
  }

  /**
   * Formatar resposta de mudança de senha
   */
  static toChangePasswordResponse(message) {
    return {
      message,
    };
  }
}

module.exports = AuthPresenter;