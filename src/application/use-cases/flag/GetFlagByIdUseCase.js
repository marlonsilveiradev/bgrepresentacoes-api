/**
 * USE CASE: Buscar Flag por ID
 */

const AppError = require('../../../shared/utils/AppError');
const CacheService = require('../../../infrastructure/services/CacheService');

class GetFlagByIdUseCase {
  constructor(flagRepository) {
    this.flagRepository = flagRepository;
  }

  async execute(id) {
    // Tentar cache
    const cacheKey = `flags:${id}`;
    const cached = await CacheService.get(cacheKey);
    if (cached) return cached;

    // Buscar BD
    const flag = await this.flagRepository.findById(id);

    if (!flag) {
      throw new AppError('Bandeira não encontrada.', 404);
    }

    // Guardar cache (10 minutos)
    await CacheService.set(cacheKey, flag, 600);

    return flag;
  }
}

module.exports = GetFlagByIdUseCase;