/**
 * INTERFACE: IFlagRepository
 * 
 * Define o "contrato" de como se comporta um repositório de Flags.
 * A implementação real fica em Infrastructure/repositories.
 * 
 * Isso permite:
 * - Trocar de BD sem afetar Use Cases
 * - Mockar facilmente em testes
 * - Seguir princípio de Inversão de Dependência
 */

class IFlagRepository {
  /**
   * Buscar flag por ID
   * @param {string} id - UUID da flag
   * @returns {Promise<Flag|null>}
   */
  async findById(id) {
    throw new Error('Método findById não implementado');
  }

  /**
   * Buscar flag por nome (único)
   * @param {string} name - Nome da flag
   * @returns {Promise<Flag|null>}
   */
  async findByName(name) {
    throw new Error('Método findByName não implementado');
  }

  /**
   * Listar flags com filtros e paginação
   * @param {Object} filters
   * @param {number} filters.page
   * @param {number} filters.limit
   * @param {boolean} [filters.is_active]
   * @param {string} [filters.search]
   * @returns {Promise<{data: Flag[], total: number, page: number, limit: number, totalPages: number}>}
   */
  async list(filters) {
    throw new Error('Método list não implementado');
  }

  /**
   * Criar nova flag
   * @param {Flag} flag - Instância da entidade Flag
   * @returns {Promise<Flag>}
   */
  async create(flag) {
    throw new Error('Método create não implementado');
  }

  /**
   * Atualizar flag
   * @param {string} id - UUID da flag
   * @param {Partial<Flag>} data - Dados a atualizar
   * @returns {Promise<Flag>}
   */
  async update(id, data) {
    throw new Error('Método update não implementado');
  }

  /**
   * Deletar flag
   * @param {string} id
   * @returns {Promise<void>}
   */
  async delete(id) {
    throw new Error('Método delete não implementado');
  }
}

module.exports = IFlagRepository;