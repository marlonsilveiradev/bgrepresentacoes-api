/**
 * USE CASE: Reativar Flag
 */

const AppError = require('../../../shared/utils/AppError');
const CacheService = require('../../../infrastructure/services/CacheService');

class ReactivateFlagUseCase {
  constructor(flagRepository) {
    this.flagRepository = flagRepository;
  }

  async execute(id) {
    // ✅ Buscar flag
    const flag = await this.flagRepository.findById(id);
    if (!flag) {
      throw new AppError('Bandeira não encontrada.', 404);
    }

    // ✅ Aplicar regra do domínio (reactivate())
    flag.reactivate();

    // ✅ Persistir
    await this.flagRepository.update(id, { is_active: true });

    // ✅ Limpar cache
    await this._invalidateCache(id);

    console.log('[ReactivateFlagUseCase] Flag reativada:', id);

    return {
      message: `Bandeira "${flag.name}" reativada com sucesso.`,
      id,
    };
  }

  async _invalidateCache(id) {
    await CacheService.del(`flags:${id}`);
    await CacheService.delPattern('flags:list:*');
  }
}

module.exports = ReactivateFlagUseCase;