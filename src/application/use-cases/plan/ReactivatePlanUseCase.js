const CacheService = require('../../../infrastructure/services/CacheService');
const logger = require('../../../infrastructure/config/logger');
const AppError = require('../../../shared/utils/AppError');
const { assertPlanAdmin } = require('./assertPlanAdmin');

class ReactivatePlanUseCase {
  constructor(planRepository) {
    this.planRepository = planRepository;
  }

  async execute(requester, id) {
    try {
      assertPlanAdmin(requester);

      const plan = await this.planRepository.findById(id);
      if (!plan) {
        throw new AppError('Plano não encontrado.', 404, 'PLAN_NOT_FOUND');
      }
      if (plan.is_active) {
        throw new AppError('Plano já está ativo.', 409, 'PLAN_ALREADY_ACTIVE');
      }

      await this.planRepository.saveInstance(plan, { is_active: true });
      logger.info({ planId: id }, '[ReactivatePlanUseCase] Plano reativado.');
      await CacheService.delPattern('plans:*');
      await CacheService.del(`plans:${id}`);

      return { message: `Plano "${plan.name}" reativado com sucesso.` };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error({ error: error.message, planId: id }, '[ReactivatePlanUseCase] Erro');
      throw new AppError('Erro ao reativar plano.', 500, 'PLAN_REACTIVATE_ERROR');
    }
  }
}

module.exports = ReactivatePlanUseCase;
