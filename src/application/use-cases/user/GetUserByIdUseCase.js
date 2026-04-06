/**
 * USE CASE: Get User By ID
 */

const AppError = require('../../../shared/utils/AppError');
const CacheService = require('../../../infrastructure/services/CacheService');

class GetUserByIdUseCase {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async execute(id) {
    const cacheKey = `users:${id}`;
    const cached = await CacheService.get(cacheKey);
    if (cached) return cached;

    const user = await this.userRepository.findById(id);

    if (!user) {
      throw new AppError('Usuário não encontrado.', 404);
    }

    await CacheService.set(cacheKey, user, 600);

    return user;
  }
}

module.exports = GetUserByIdUseCase;