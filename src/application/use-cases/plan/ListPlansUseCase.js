const CacheService = require('../../../infrastructure/services/CacheService');
const logger = require('../../../infrastructure/config/logger');
const AppError = require('../../../shared/utils/AppError');

class ListPlansUseCase {
  constructor(planRepository) {
    this.planRepository = planRepository;
  }

  async execute({ page = 1, limit = 20, is_active, flag_id, search } = {}) {
    try {
      const cacheKey = `plans:list:${page}:${limit}:${is_active}:${flag_id || 'none'}:${search || 'none'}`;
      const cached = await CacheService.get(cacheKey);
      if (cached) {
        return cached;
      }

      const { rows, count } = await this.planRepository.findAndCountForList({
        page,
        limit,
        is_active,
        flag_id,
        search,
      });

      const result = {
        rows: rows.map(r => (r.toJSON ? r.toJSON() : r)),
        count,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
      };

      await CacheService.set(cacheKey, result);
      return result;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error({ error: error.message }, '[ListPlansUseCase] Erro ao listar planos');
      throw new AppError('Erro ao listar planos.', 500, 'PLANS_LIST_ERROR');
    }
  }
}

module.exports = ListPlansUseCase;
