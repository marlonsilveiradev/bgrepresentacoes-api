/**
 * INTERFACE: IClientRepository
 * 
 * Responsabilidade: Contrato para operações de persistência de clientes
 * 
 * @abstract
 */

class IClientRepository {
  /**
   * Criar novo cliente
   * 
   * @param {Object} clientData - Dados do cliente
   * @param {Object} options - Opções (transaction, etc)
   * @returns {Promise<Object>} Cliente criado com ID
   * @throws {AppError}
   * 
   * @abstract
   */
  async create(clientData, options = {}) {
    throw new Error('create() deve ser implementado');
  }

  /**
   * Buscar cliente por ID
   * 
   * @param {string} id - UUID do cliente
   * @returns {Promise<Object|null>} Cliente ou null
   * 
   * @abstract
   */
  async findById(id) {
    throw new Error('findById() deve ser implementado');
  }

  /**
   * Atualizar cliente
   * 
   * @param {string} id - UUID do cliente
   * @param {Object} data - Dados a atualizar
   * @param {Object} options - Opções (transaction, etc)
   * @returns {Promise<Object>} Cliente atualizado
   * @throws {AppError}
   * 
   * @abstract
   */
  async update(id, data, options = {}) {
    throw new Error('update() deve ser implementado');
  }

  /**
   * Deletar cliente (soft delete)
   * 
   * @param {string} id - UUID do cliente
   * @param {Object} options - Opções (transaction, etc)
   * @returns {Promise<void>}
   * @throws {AppError}
   * 
   * @abstract
   */
  async delete(id, options = {}) {
    throw new Error('delete() deve ser implementado');
  }
}

module.exports = IClientRepository;