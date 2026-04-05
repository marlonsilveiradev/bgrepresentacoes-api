/**
 * USE CASE: Desativar Flag
 */

const AppError = require('../../../shared/utils/AppError');
const CacheService = require('../../../infrastructure/services/CacheService');

class DeactivateFlagUseCase {
  constructor(flagRepository) {
    this.flagRepository = flagRepository;
  }

  async execute(id) {
    // ✅ Buscar flag
    const flag = await this.flagRepository.findById(id);
    if (!flag) {
      throw new AppError('Bandeira não encontrada.', 404);
    }

    // ✅ Aplicar regra do domínio (deactivate())
    flag.deactivate();

    // ✅ Persistir
    await this.flagRepository.update(id, { is_active: false });

    // ✅ Limpar cache
    await this._invalidateCache(id);

    console.log('[DeactivateFlagUseCase] Flag desativada:', id);

    return {
      message: `Bandeira "${flag.name}" desativada com sucesso.`,
      id,
    };
  }

  async _invalidateCache(id) {
    await CacheService.del(`flags:${id}`);
    await CacheService.delPattern('flags:list:*');
  }
}

module.exports = DeactivateFlagUseCase;