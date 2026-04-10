const AppError = require('../../../shared/utils/AppError');
const logger = require('../../../infrastructure/config/logger');
const { ROLES } = require('../../../shared/constants/roles');

class ListSalesUseCase {
  constructor(saleRepository) {
    this.saleRepository = saleRepository;
  }

  async execute(filters, requester) {
    try {
      const { page = 1, limit = 20, status, client_id, sold_by, plan_id } = filters;

      // ✅ Construir filtros com base no papel
      const where = this._buildAccessFilter(requester, { status, client_id, sold_by, plan_id });

      const { rows, count } = await this.saleRepository.findAll({
        where,
        limit,
        offset: (page - 1) * limit,
        order: [['created_at', 'DESC']],
      });

      return {
        data: rows,
        pagination: {
          page,
          limit,
          total: count,
          pages: Math.ceil(count / limit),
        },
      };

    } catch (error) {
      if (error instanceof AppError) throw error;

      logger.error(
        { error: error.message, userId: requester.id },
        '[ListSalesUseCase] Erro ao listar vendas'
      );

      throw new AppError('Erro ao listar vendas', 500, 'SALES_LIST_ERROR');
    }
  }

  _buildAccessFilter(requester, filters) {
    const where = {};

    // Aplicar filtros baseado na role
    if (requester.role === ROLES.USER) {
      where.sold_by = requester.id;
    } else if (requester.role === ROLES.PARTNER) {
      where.partner_id = requester.id;
    }

    // Aplicar filtros do usuário (admin pode filtrar por qualquer coisa)
    if (filters.status) where.status = filters.status;
    if (filters.client_id) where.client_id = filters.client_id;
    if (filters.plan_id) where.plan_id = filters.plan_id;

    if (requester.role === ROLES.ADMIN && filters.sold_by) {
      where.sold_by = filters.sold_by;
    }

    return where;
  }
}

module.exports = ListSalesUseCase;