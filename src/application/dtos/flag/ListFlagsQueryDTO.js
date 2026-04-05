/**
 * DTO: Parâmetros de listagem de Flags
 */

class ListFlagsQueryDTO {
  constructor({ page = 1, limit = 20, is_active, search }) {
    this.page = Math.max(1, parseInt(page, 10) || 1);
    this.limit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    this.is_active = is_active === undefined ? undefined : is_active === 'true' || is_active === true;
    this.search = search ? search.trim() : undefined;
  }

  /**
   * Serializar para passar ao repositório
   */
  toRepositoryFilters() {
    return {
      page: this.page,
      limit: this.limit,
      is_active: this.is_active,
      search: this.search,
    };
  }
}

module.exports = ListFlagsQueryDTO;