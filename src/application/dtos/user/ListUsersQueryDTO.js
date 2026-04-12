/**
 * DTO: List Users Query
 * Parâmetros de paginação e filtro
 */

class ListUsersQueryDTO {
  constructor({ page, limit, role, is_active, search }) {
    this.page = Math.max(1, parseInt(page, 10) || 1);
    this.limit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    this.role = role;
    
    // Converter string para boolean
    if (is_active !== undefined && is_active !== null) {
      this.is_active = String(is_active).toLowerCase() === 'true' || is_active === '1' || is_active === true;
    }
    this.search = search ? search.trim() : undefined;
  }

  toRepositoryFilters() {
    return {
      page: this.page,
      limit: this.limit,
      role: this.role,
      is_active: this.is_active,
      search: this.search,
    };
  }
}

module.exports = ListUsersQueryDTO;