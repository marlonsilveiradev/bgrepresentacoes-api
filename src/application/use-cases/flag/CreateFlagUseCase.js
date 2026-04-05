/**
 * USE CASE: Criar Flag
 * 
 * REGRAS DO DOMÍNIO:
 * 1. Nome deve ser único
 * 2. Nome e preço são obrigatórios
 * 3. Preço deve ser > 0
 */

const Flag = require('../../../domain/entities/Flag');
const AppError = require('../../../shared/utils/AppError');
const CacheService = require('../../../infrastructure/services/CacheService');
const { v4: uuid } = require('uuid');

class CreateFlagUseCase {
  constructor(flagRepository) {
    this.flagRepository = flagRepository;
  }

  async execute(createFlagDTO) {
    // ✅ REGRA 1: Verificar se nome já existe
    const existing = await this.flagRepository.findByName(createFlagDTO.name);
    if (existing) {
      throw new AppError('Já existe uma bandeira com esse nome.', 409);
    }

    // ✅ REGRA 2: Criar entidade Flag (validação automática no construtor)
    const flag = new Flag({
      id: uuid(), // Gerar UUID
      name: createFlagDTO.name,
      description: createFlagDTO.description,
      price: createFlagDTO.price,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    });

    // ✅ REGRA 3: Persistir no repositório
    const savedFlag = await this.flagRepository.create(flag);

    // ✅ LIMPEZA DE CACHE: Invalidar lista de flags
    await this._invalidateListCache();

    console.log('[CreateFlagUseCase] Flag criada:', savedFlag.id);

    return savedFlag;
  }

  /**
   * Limpar todos os caches de lista
   */
  async _invalidateListCache() {
    await CacheService.delPattern('flags:list:*');
  }
}

module.exports = CreateFlagUseCase;