const CacheService = require('../../../infrastructure/services/CacheService');
const logger = require('../../../infrastructure/config/logger');
const AppError = require('../../../shared/utils/AppError');
const { assertPlanAdmin } = require('./assertPlanAdmin');
const GetPlanByIdUseCase = require('./GetPlanByIdUseCase');

class UpdatePlanUseCase {
  constructor(planRepository, flagRepository) {
    this.planRepository = planRepository;
    this.flagRepository = flagRepository;
  }

  async execute(requester, id, data) {
    try {
      assertPlanAdmin(requester);

      const plan = await this.planRepository.findById(id);
      if (!plan) {
        throw new AppError('Plano não encontrado.', 404, 'PLAN_NOT_FOUND');
      }

      const { flag_ids, ...planData } = data;

      if (Object.keys(planData).length > 0) {
        const payload = { ...planData };
        if (payload.name) {
          payload.name = String(payload.name).trim();
        }
        await this.planRepository.saveInstance(plan, payload);
      }

      if (flag_ids !== undefined) {
        await this._validateFlags(flag_ids);
        await this.planRepository.destroyPlanFlagsByPlanId(id);
        if (flag_ids.length > 0) {
          await this.planRepository.bulkCreatePlanFlags(
            flag_ids.map(flag_id => ({ plan_id: id, flag_id }))
          );
        }
        logger.info({ planId: id, newFlags: flag_ids }, '[UpdatePlanUseCase] Bandeiras do plano sincronizadas.');
      }

      logger.info({ planId: id, changes: Object.keys(data) }, '[UpdatePlanUseCase] Plano atualizado.');
      await CacheService.delPattern('plans:*');
      await CacheService.del(`plans:${id}`);

      const getPlanByIdUseCase = new GetPlanByIdUseCase(this.planRepository);
      return getPlanByIdUseCase.execute(id);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error({ error: error.message, planId: id }, '[UpdatePlanUseCase] Erro ao atualizar plano');
      throw new AppError('Erro ao atualizar plano.', 500, 'PLAN_UPDATE_ERROR');
    }
  }

  async _validateFlags(flagIds) {
    if (!flagIds || flagIds.length === 0) {
      return [];
    }
    const flags = await this.flagRepository.findActiveByIds(flagIds);
    if (flags.length !== flagIds.length) {
      const foundIds = flags.map(f => f.id);
      const missing = flagIds.filter(fid => !foundIds.includes(fid));
      throw new AppError(
        `Bandeira(s) não encontrada(s) ou inativa(s): ${missing.join(', ')}`,
        422,
        'FLAGS_INVALID'
      );
    }
    return flags;
  }
}

module.exports = UpdatePlanUseCase;
