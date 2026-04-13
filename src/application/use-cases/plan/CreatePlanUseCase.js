const CacheService = require('../../../infrastructure/services/CacheService');
const logger = require('../../../infrastructure/config/logger');
const AppError = require('../../../shared/utils/AppError');
const { assertPlanAdmin } = require('./assertPlanAdmin');
const GetPlanByIdUseCase = require('./GetPlanByIdUseCase');

class CreatePlanUseCase {
  constructor(planRepository, flagRepository) {
    this.planRepository = planRepository;
    this.flagRepository = flagRepository;
  }

  async execute(requester, { name, description, price, flag_ids = [] }) {
    try {
      assertPlanAdmin(requester);

      await this._validateFlags(flag_ids);

      const plan = await this.planRepository.create({
        name,
        description,
        price,
        is_active: true,
      });

      if (flag_ids.length > 0) {
        await this.planRepository.bulkCreatePlanFlags(
          flag_ids.map(flag_id => ({ plan_id: plan.id, flag_id }))
        );
      }

      logger.info({ planId: plan.id, flags: flag_ids }, '[CreatePlanUseCase] Plano criado.');
      await CacheService.delPattern('plans:*');

      const getPlanByIdUseCase = new GetPlanByIdUseCase(this.planRepository);
      return getPlanByIdUseCase.execute(plan.id);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error({ error: error.message }, '[CreatePlanUseCase] Erro ao criar plano');
      throw new AppError('Erro ao criar plano.', 500, 'PLAN_CREATE_ERROR');
    }
  }

  async _validateFlags(flagIds) {
    if (!flagIds || flagIds.length === 0) {
      return [];
    }
    const flags = await this.flagRepository.findActiveByIds(flagIds);
    if (flags.length !== flagIds.length) {
      const foundIds = flags.map(f => f.id);
      const missing = flagIds.filter(id => !foundIds.includes(id));
      throw new AppError(
        `Bandeira(s) não encontrada(s) ou inativa(s): ${missing.join(', ')}`,
        422,
        'FLAGS_INVALID'
      );
    }
    return flags;
  }
}

module.exports = CreatePlanUseCase;
