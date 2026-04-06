/**
 * CONTAINER: AuthContainer
 * Responsabilidade: Injeção de Dependências para Autenticação
 * Padrão: Lazy Loading para evitar erros de inicialização do Sequelize
 */

const { UserRepository, RefreshTokenRepository } = require('../repositories');
const {
  LoginUseCase,
  ChangePasswordUseCase,
  RefreshAccessTokenUseCase,
} = require('../../application/use-cases/auth');

class AuthContainer {
  constructor() {
    // Inicializamos as instâncias como null
    this._userRepository = null;
    this._refreshTokenRepository = null;
    this._loginUseCase = null;
    this._changePasswordUseCase = null;
    this._refreshAccessTokenUseCase = null;
  }

  /**
   * Getter para o banco de dados.
   * Garante que o Sequelize só seja carregado quando um método for chamado.
   */
  get db() {
    return require('../database');
  }

  // ─── Repositories ──────────────────────────────────────────────────────────

  getUserRepository() {
    if (!this._userRepository) {
      this._userRepository = new UserRepository(this.db.User);
    }
    return this._userRepository;
  }

  getRefreshTokenRepository() {
    if (!this._refreshTokenRepository) {
      this._refreshTokenRepository = new RefreshTokenRepository(this.db.RefreshToken);
    }
    return this._refreshTokenRepository;
  }

  // ─── Use Cases ─────────────────────────────────────────────────────────────

  /**
   * Retorna a instância de LoginUseCase
   */
  getLoginUseCase() {
    if (!this._loginUseCase) {
      this._loginUseCase = new LoginUseCase(
        this.getUserRepository(),
        this.getRefreshTokenRepository()
      );
    }
    return this._loginUseCase;
  }

  /**
   * Retorna a instância de ChangePasswordUseCase
   * Resolve o erro: "getChangePasswordUseCase is not a function"
   */
  getChangePasswordUseCase() {
    if (!this._changePasswordUseCase) {
      this._changePasswordUseCase = new ChangePasswordUseCase(
        this.getUserRepository(),
        this.getRefreshTokenRepository()
      );
    }
    return this._changePasswordUseCase;
  }

  /**
   * Retorna a instância de RefreshAccessTokenUseCase
   */
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