/**
 * INTERFACE: IUserRepository
 * Contrato para repositório de usuários
 * ⚠️ Adicionar novos métodos para User Management
 */

class IUserRepository {
  // === AUTH (já existem) ===
  async findByEmail(email) {
    throw new Error('Método findByEmail não implementado');
  }

  async findByIdWithPassword(userId) {
    throw new Error('Método findByIdWithPassword não implementado');
  }

  async findById(userId) {
    throw new Error('Método findById não implementado');
  }

  async updatePassword(userId, newPassword) {
    throw new Error('Método updatePassword não implementado');
  }

  async updateLastLogin(userId) {
    throw new Error('Método updateLastLogin não implementado');
  }

  // === USER MANAGEMENT (novos) ===

  /**
   * Listar usuários com filtros
   */
  async list(filters) {
    throw new Error('Método list não implementado');
  }

  /**
   * Criar novo usuário
   */
  async create(user, password) {
    throw new Error('Método create não implementado');
  }

  /**
   * Atualizar dados do usuário
   */
  async update(userId, data) {
    throw new Error('Método update não implementado');
  }

  /**
   * Verificar se email está em uso
   */
  async isEmailInUse(email, excludeUserId = null) {
    throw new Error('Método isEmailInUse não implementado');
  }

  /**
   * Desativar usuário
   */
  async deactivate(userId) {
    throw new Error('Método deactivate não implementado');
  }

  /**
   * Reativar usuário
   */
  async reactivate(userId) {
    throw new Error('Método reactivate não implementado');
  }
}

module.exports = IUserRepository;