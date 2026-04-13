/**
 * USE CASE: Validar Plano ou Bandeiras (onboarding)
 * Usa repositórios injetados ou os singletons do index (retrocompatível).
 */

const AppError = require('../../../shared/utils/AppError');

let defaultPlanRepository;
let defaultFlagRepository;

function loadDefaults() {
  if (!defaultPlanRepository) {
    const repos = require('../../../infrastructure/repositories');
    defaultPlanRepository = repos.planRepository;
    defaultFlagRepository = repos.flagRepository;
  }
}

class ValidatePlanOrFlagsUseCase {
  constructor(planRepository, flagRepository) {
    loadDefaults();
    this.planRepository = planRepository ?? defaultPlanRepository;
    this.flagRepository = flagRepository ?? defaultFlagRepository;
  }

  async execute(planId, flagIds) {
    const hasPlan = planId && typeof planId === 'string';
    const hasFlags = Array.isArray(flagIds) && flagIds.length > 0;

    if (!hasPlan && !hasFlags) {
      throw new AppError('Informe um plano ou ao menos uma bandeira', 422);
    }

    if (hasPlan) {
      const plan = await this.planRepository.findByIdWithFlags(planId);

      if (!plan) {
        throw new AppError('Plano selecionado é inválido ou não está ativo', 422);
      }

      if (!plan.is_active) {
        throw new AppError('Plano está inativo', 422);
      }

      return { plan, selectedFlags: null };
    }

    const flags = await this.flagRepository.findActiveByIds(flagIds);

    if (flags.length !== flagIds.length) {
      throw new AppError('Uma ou mais bandeiras selecionadas são inválidas', 422);
    }

    return { plan: null, selectedFlags: flags };
  }
}

module.exports = ValidatePlanOrFlagsUseCase;
