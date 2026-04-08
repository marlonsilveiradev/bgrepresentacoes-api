/**
 * INTERFACE: IClientDocumentRepository
 * 
 * Responsabilidade: Contrato para persistência de documentos de cliente
 * 
 * @abstract
 */

class IClientDocumentRepository {
  /**
   * Criar novo documento
   * 
   * @param {Object} documentData - Dados do documento
   * @param {Object} options - Opções (transaction, etc)
   * @returns {Promise<Object>} Documento criado
   * @throws {AppError}
   * 
   * @abstract
   */
  async create(documentData, options = {}) {
    throw new Error('create() deve ser implementado');
  }

  /**
   * Buscar documento por tipo e cliente
   * 
   * @param {string} clientId - UUID do cliente
   * @param {string} docType - Tipo do documento
   * @param {Object} options - Opções (transaction, etc)
   * @returns {Promise<Object|null>} Documento ou null
   * 
   * @abstract
   */
  async findByType(clientId, docType, options = {}) {
    throw new Error('findByType() deve ser implementado');
  }

  /**
   * Atualizar documento
   * 
   * @param {string} id - UUID do documento
   * @param {Object} data - Dados a atualizar
   * @param {Object} options - Opções (transaction, etc)
   * @returns {Promise<Object>} Documento atualizado
   * @throws {AppError}
   * 
   * @abstract
   */
  async update(id, data, options = {}) {
    throw new Error('update() deve ser implementado');
  }

  /**
   * Deletar documento
   * 
   * @param {string} id - UUID do documento
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

module.exports = IClientDocumentRepository;