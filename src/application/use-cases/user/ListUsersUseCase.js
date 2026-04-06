/**
 * USE CASE: List Users
 */

const CacheService = require('../../../infrastructure/services/CacheService');

class ListUsersUseCase {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async execute(listUsersQueryDTO) {
    const cacheKey = this._generateCacheKey(listUsersQueryDTO);

    const cached = await CacheService.get(cacheKey);
    if (cached) {
      console.log('[ListUsersUseCase] Cache hit:', cacheKey);
      return cached;
    }

    const result = await this.userRepository.list(
      listUsersQueryDTO.toRepositoryFilters()
    );

    await CacheService.set(cacheKey, result, 600);

    return result;
  }

  _generateCacheKey(dto) {
    const parts = [
      'users:list',
      dto.page,
      dto.limit,
      dto.role || 'all',
      dto.is_active !== undefined ? dto.is_active : 'all',
      dto.search || 'none',
    ];
    return parts.join(':');
  }
}

module.exports = ListUsersUseCase;