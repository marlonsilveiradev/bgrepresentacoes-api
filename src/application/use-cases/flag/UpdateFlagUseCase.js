/**
 * USE CASE: Atualizar Flag
 */

const AppError = require('../../../shared/utils/AppError');
const CacheService = require('../../../infrastructure/services/CacheService');

class UpdateFlagUseCase {
  constructor(flagRepository) {
    this.flagRepository = flagRepository;
  }

  async execute(id, updateFlagDTO) {
    // ✅ Verificar se existe
    const flag = await this.flagRepository.findById(id);
    if (!flag) {
      throw new AppError('Bandeira não encontrada.', 404);
    }

    // ✅ Se mudando nome, verificar unicidade
    if (updateFlagDTO.name && updateFlagDTO.name.trim() !== flag.name) {
      const existing = await this.flagRepository.findByName(updateFlagDTO.name);
      if (existing) {
        throw new AppError('Já existe uma bandeira com esse nome.', 409);
      }
    }

    // ✅ Atualizar dados (validação na entidade)
    flag.update({
      name: updateFlagDTO.name,
      description: updateFlagDTO.description,
      price: updateFlagDTO.price,
    });

    // ✅ Persistir
    const updated = await this.flagRepository.update(id, {
      name: flag.name,
      description: flag.description,
      price: flag.price,
      is_active: flag.is_active,
    });

    // ✅ Limpar cache
    await this._invalidateCache(id);

    console.log('[UpdateFlagUseCase] Flag atualizada:', id);

    return updated;
  }

  async _invalidateCache(id) {
    await CacheService.del(`flags:${id}`);
    await CacheService.delPattern('flags:list:*');
  }
}

module.exports = UpdateFlagUseCase;