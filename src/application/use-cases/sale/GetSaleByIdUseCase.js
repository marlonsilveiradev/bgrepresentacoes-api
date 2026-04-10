const AppError = require('../../../shared/utils/AppError');
const logger = require('../../../infrastructure/config/logger');
const { ROLES } = require('../../../shared/constants/roles');

class GetSaleByIdUseCase {
  constructor(saleRepository) {
    this.saleRepository = saleRepository;
  }

  async execute(saleId, requester) {
    try {
      const sale = await this.saleRepository.findByIdWithRelations(saleId);

      if (!sale) {
        throw new AppError('Venda não encontrada.', 404, 'SALE_NOT_FOUND');
      }

      // ✅ Validar acesso
      this._assertCanView(sale, requester);

      return sale;

    } catch (error) {
      if (error instanceof AppError) throw error;

      logger.error(
        { error: error.message, saleId, userId: requester.id },
        '[GetSaleByIdUseCase] Erro ao buscar venda'
      );

      throw new AppError('Erro ao buscar venda', 500, 'SALE_FETCH_ERROR');
    }
  }

  _assertCanView(sale, requester) {
    const isAdmin = requester.role === ROLES.ADMIN;
    const isSeller = sale.sold_by === requester.id;
    const isPartner = requester.role === ROLES.PARTNER && sale.partner_id === requester.id;

    if (!isAdmin && !isSeller && !isPartner) {
      throw new AppError('Você não tem permissão para visualizar esta venda.', 403);
    }
  }
}

module.exports = GetSaleByIdUseCase;