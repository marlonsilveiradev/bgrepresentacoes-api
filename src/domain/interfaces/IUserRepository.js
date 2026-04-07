/**
 * INTERFACE: IUserRepository
 * Contrato para repositório de usuários
 * ⚠️ Adicionar novos métodos para User Management
 */

const AppError = require('../../shared/utils/AppError')

class IUserRepository {
  // === AUTH (já existem) ===
  async findByEmail(email) {
    throw new AppError('Método findByEmail não implementado');
  }

  async findByIdWithPassword(userId) {
    throw new AppError('Método findByIdWithPassword não implementado');
  }

  async findById(userId) {
    throw new AppError('Método findById não implementado');
  }

  async updatePassword(userId, newPassword) {
    throw new AppError('Método updatePassword não implementado');
  }

  async updateLastLogin(userId) {
    throw new AppError('Método updateLastLogin não implementado');
  }

  // === USER MANAGEMENT (novos) ===

  /**
   * Listar usuários com filtros
   */
  async list(filters) {
    throw new AppError('Método list não implementado');
  }

  /**
   * Criar novo usuário
   */
  async create(user, password) {
    throw new AppError('Método create não implementado');
  }

  /**
   * Atualizar dados do usuário
   */
  async update(userId, data) {
    throw new AppError('Método update não implementado');
  }

  /**
   * Verificar se email está em uso
   */
  async isEmailInUse(email, excludeUserId = null) {
    throw new AppError('Método isEmailInUse não implementado');
  }

  /**
   * Desativar usuário
   */
  async deactivate(userId) {
    throw new AppError('Método deactivate não implementado');
  }

  /**
   * Reativar usuário
   */
  async reactivate(userId) {
    throw new AppError('Método reactivate não implementado');
  }
}

module.exports = IUserRepository;