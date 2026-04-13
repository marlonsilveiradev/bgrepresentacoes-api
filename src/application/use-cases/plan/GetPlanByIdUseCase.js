const CacheService = require('../../../infrastructure/services/CacheService');
const logger = require('../../../infrastructure/config/logger');
const AppError = require('../../../shared/utils/AppError');

class GetPlanByIdUseCase {
  constructor(planRepository) {
    this.planRepository = planRepository;
  }

  async execute(id) {
    try {
      const cacheKey = `plans:${id}`;
      const cached = await CacheService.get(cacheKey);
      if (cached) {
        return cached;
      }

      const plan = await this.planRepository.findByIdWithDetail(id);
      if (!plan) {
        throw new AppError('Plano não encontrado.', 404, 'PLAN_NOT_FOUND');
      }

      const plain = plan.toJSON ? plan.toJSON() : plan;
      await CacheService.set(cacheKey, plain);
      return plain;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error({ error: error.message, planId: id }, '[GetPlanByIdUseCase] Erro ao buscar plano');
      throw new AppError('Erro ao buscar plano.', 500, 'PLAN_FETCH_ERROR');
    }
  }
}

module.exports = GetPlanByIdUseCase;
