/**
 * USE CASE: Validar Plano ou Bandeiras
 * Responsável por validar o plano ou bandeiras selecionadas
 */

const { Plan, Flag } = require('../../../infrastructure/repositories/models');
const AppError = require('../../../shared/utils/AppError');

class ValidatePlanOrFlagsUseCase {
  async execute(planId, flagIds) {
    const hasPlan = planId && typeof planId === 'string';
    const hasFlags = Array.isArray(flagIds) && flagIds.length > 0;

    if (!hasPlan && !hasFlags) {
      throw new AppError('Informe um plano ou ao menos uma bandeira', 422);
    }

    // ✅ Se tem plano
    if (hasPlan) {
      const plan = await Plan.findByPk(planId, {
        include: [{ model: Flag, as: 'flags', through: { attributes: [] } }],
      });

      if (!plan) {
        throw new AppError('Plano selecionado é inválido ou não está ativo', 422);
      }

      if (!plan.is_active) {
        throw new AppError('Plano está inativo', 422);
      }

      return { plan, selectedFlags: null };
    }

    // ✅ Se tem bandeiras individuais
    const flags = await Flag.findAll({
      where: { id: flagIds, is_active: true },
    });

    if (flags.length !== flagIds.length) {
      throw new AppError('Uma ou mais bandeiras selecionadas são inválidas', 422);
    }

    return { plan: null, selectedFlags: flags };
  }
}

module.exports = ValidatePlanOrFlagsUseCase;