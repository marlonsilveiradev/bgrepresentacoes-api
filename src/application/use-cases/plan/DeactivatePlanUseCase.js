const CacheService = require('../../../infrastructure/services/CacheService');
const logger = require('../../../infrastructure/config/logger');
const AppError = require('../../../shared/utils/AppError');
const { assertPlanAdmin } = require('./assertPlanAdmin');

class DeactivatePlanUseCase {
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
      if (!plan.is_active) {
        throw new AppError('Plano já está desativado.', 409, 'PLAN_ALREADY_INACTIVE');
      }

      await this.planRepository.saveInstance(plan, { is_active: false });
      logger.info({ planId: id }, '[DeactivatePlanUseCase] Plano desativado.');
      await CacheService.delPattern('plans:*');
      await CacheService.del(`plans:${id}`);

      return { message: `Plano "${plan.name}" desativado com sucesso.` };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error({ error: error.message, planId: id }, '[DeactivatePlanUseCase] Erro');
      throw new AppError('Erro ao desativar plano.', 500, 'PLAN_DEACTIVATE_ERROR');
    }
  }
}

module.exports = DeactivatePlanUseCase;
