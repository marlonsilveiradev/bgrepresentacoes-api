/**
 * CONTAINER: AuthContainer
 * ✅ AJUSTADO: Usando instâncias pré-fabricadas do Repositories Index
 */

// Importamos as instâncias em camelCase vindas do seu novo index de repositories
const { userRepository, refreshTokenRepository } = require('../repositories');

const {
  LoginUseCase,
  ChangePasswordUseCase,
  RefreshAccessTokenUseCase,
} = require('../../application/use-cases/auth');

class AuthContainer {
  constructor() {
    // Mantemos apenas o cache para os Use Cases
    this._loginUseCase = null;
    this._changePasswordUseCase = null;
    this._refreshAccessTokenUseCase = null;
  }

  // ─── Repositories ──────────────────────────────────────────────────────────
  
  // Note que aqui não usamos mais 'new'. Apenas retornamos a instância pronta.
  getUserRepository() {
    return userRepository;
  }

  getRefreshTokenRepository() {
    return refreshTokenRepository;
  }

  // ─── Use Cases ─────────────────────────────────────────────────────────────

  getLoginUseCase() {
    if (!this._loginUseCase) {
      this._loginUseCase = new LoginUseCase(
        this.getUserRepository(),
        this.getRefreshTokenRepository()
      );
    }
    return this._loginUseCase;
  }

  getChangePasswordUseCase() {
    if (!this._changePasswordUseCase) {
      this._changePasswordUseCase = new ChangePasswordUseCase(
        this.getUserRepository(),
        this.getRefreshTokenRepository()
      );
    }
    return this._changePasswordUseCase;
  }

  getRefreshAccessTokenUseCase() {
    if (!this._refreshAccessTokenUseCase) {
      this._refreshAccessTokenUseCase = new RefreshAccessTokenUseCase(
        this.getUserRepository(),
        this.getRefreshTokenRepository()
      );
    }
    return this._refreshAccessTokenUseCase;
  }
}

// Exporta uma única instância (Singleton)
module.exports = new AuthContainer();