/**
 * CONTAINER: Auth Dependencies
 * Injeção de dependências centralizada
 */

const { UserRepository, RefreshTokenRepository } = require('../repositories');
const {
  LoginUseCase,
  ChangePasswordUseCase,
  RefreshAccessTokenUseCase,
} = require('../../application/use-cases/auth');

class AuthContainer {
  constructor() {
    // Repositories (singleton)
    this.userRepository = new UserRepository();
    this.refreshTokenRepository = new RefreshTokenRepository();

    // Use Cases (singleton)
    this.loginUseCase = new LoginUseCase(
      this.userRepository,
      this.refreshTokenRepository
    );

    this.changePasswordUseCase = new ChangePasswordUseCase(
      this.userRepository,
      this.refreshTokenRepository
    );

    this.refreshAccessTokenUseCase = new RefreshAccessTokenUseCase(
      this.userRepository,
      this.refreshTokenRepository
    );
  }

  getLoginUseCase() {
    return this.loginUseCase;
  }

  getChangePasswordUseCase() {
    return this.changePasswordUseCase;
  }

  getRefreshAccessTokenUseCase() {
    return this.refreshAccessTokenUseCase;
  }

  getRefreshTokenRepository() {
    return this.refreshTokenRepository;
  }
}

module.exports = new AuthContainer();