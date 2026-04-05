/**
 * USE CASE: Listar Flags
 * 
 * Responsabilidade: Orquestrar a operação de listagem.
 * 
 * ✅ Faz:
 * - Recebe DTO
 * - Usa repositório
 * - Aplica cache (se necessário)
 * 
 * ❌ Não faz:
 * - HTTP
 * - Formatação para resposta (Presenter faz)
 */

const CacheService = require('../../../infrastructure/services/CacheService');

class ListFlagsUseCase {
  constructor(flagRepository) {
    this.flagRepository = flagRepository;
  }

  async execute(listFlagsQueryDTO) {
    // Gerar chave de cache única
    const cacheKey = this._generateCacheKey(listFlagsQueryDTO);

    // ✅ TENTAR BUSCAR DO CACHE
    const cached = await CacheService.get(cacheKey);
    if (cached) {
      console.log('[ListFlagsUseCase] Cache hit:', cacheKey);
      return cached;
    }

    // ❌ CACHE MISS - Buscar do repositório
    console.log('[ListFlagsUseCase] Cache miss, querying database');

    const result = await this.flagRepository.list(
      listFlagsQueryDTO.toRepositoryFilters()
    );

    // ✅ GUARDAR NO CACHE (10 minutos)
    await CacheService.set(cacheKey, result, 600);

    return result;
  }

  /**
   * Gerar chave de cache baseada nos filtros
   */
  _generateCacheKey(dto) {
    const parts = [
      'flags:list',
      dto.page,
      dto.limit,
      dto.is_active !== undefined ? dto.is_active : 'all',
      dto.search || 'none',
    ];
    return parts.join(':');
  }
}

module.exports = ListFlagsUseCase;