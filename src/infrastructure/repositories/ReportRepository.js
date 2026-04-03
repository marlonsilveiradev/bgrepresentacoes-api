const { Op } = require('sequelize');
const { Client, Sale, Plan, User, SaleFlag, Flag } = require('./models');

/**
 * Constrói { start, end } a partir dos filtros de data.
 * @private
 */
const _buildDateRange = ({ year, month, day, date_start, date_end }) => {
  if (date_start || date_end) {
    const start = date_start ? new Date(date_start) : new Date('2020-01-01');
    const end   = date_end   ? new Date(date_end)   : new Date();
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  if (!year) return null;

  if (month && day) {
    const start = new Date(year, month - 1, day, 0, 0, 0, 0);
    const end   = new Date(year, month - 1, day, 23, 59, 59, 999);
    return { start, end };
  }

  if (month) {
    const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
    const end   = new Date(year, month, 0, 23, 59, 59, 999);
    return { start, end };
  }

  const start = new Date(year, 0, 1, 0, 0, 0, 0);
  const end   = new Date(year, 11, 31, 23, 59, 59, 999);
  return { start, end };
};

class ReportRepository {
  /**
   * Retorna os dados crus do relatório de vendas (clientes + vendas + parceiros)
   * @param {Object} filters - { year, month, day, date_start, date_end, partner_id, overall_status }
   * @param {Object} pagination - { page, limit }
   * @returns {Promise<{ rows: Client[], count: number }>}
   */
  async getSalesReportData(filters, pagination) {
    const {
      year, month, day,
      date_start, date_end,
      partner_id,
      overall_status,
    } = filters;

    const { page = 1, limit = 20 } = pagination;
    const offset = (page - 1) * limit;

    // 1. Intervalo de datas
    const dateRange = _buildDateRange({ year, month, day, date_start, date_end });

    // 2. Filtros do Client
    const clientWhere = {};
    if (partner_id) clientWhere.partner_id = partner_id;
    if (overall_status) clientWhere.overall_status = overall_status;

    // 3. Filtro das Sales
    const saleWhere = {};
    if (dateRange) {
      saleWhere.created_at = { [Op.between]: [dateRange.start, dateRange.end] };
    }

    // 4. Consulta paginada (dados brutos)
    const { rows, count } = await Client.findAndCountAll({
      where: clientWhere,
      attributes: ['id', 'corporate_name', 'overall_status', 'created_at', 'partner_id'],
      include: [
        {
          model: Sale,
          as: 'sales',
          where: saleWhere,
          required: true,
          attributes: [
            'id', 'total_value', 'status', 'plan_name', 'plan_price',
            'sold_by', 'created_at', 'approved_at',
          ],
          include: [
            {
              model: Plan,
              as: 'plan',
              attributes: ['id', 'name', 'price'],
              required: false,
            },
            {
              model: SaleFlag,
              as: 'saleFlags',
              attributes: ['flag_id', 'price', 'status'],
              include: [{
                model: Flag,
                as: 'flag',
                attributes: ['id', 'name'],
              }],
            },
          ],
        },
        {
          model: User,
          as: 'partner',
          attributes: ['id', 'name', 'email'],
          required: false,
        },
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset,
      distinct: true,
      subQuery: false,
    });

    return { rows, count };
  }

  /**
   * Retorna o sumário do relatório (totais) para os mesmos filtros
   * @param {Object} filters - mesmos filtros acima
   * @returns {Promise<{ total_value: number, avg_value: number, sales_count: number }>}
   */
  async getSalesReportSummary(filters) {
    const {
      year, month, day,
      date_start, date_end,
      partner_id,
      overall_status,
    } = filters;

    const dateRange = _buildDateRange({ year, month, day, date_start, date_end });

    const clientWhere = {};
    if (partner_id) clientWhere.partner_id = partner_id;
    if (overall_status) clientWhere.overall_status = overall_status;

    const saleWhere = {};
    if (dateRange) {
      saleWhere.created_at = { [Op.between]: [dateRange.start, dateRange.end] };
    }

    const summaryResult = await Sale.findAll({
      where: saleWhere,
      include: [
        {
          model: Client,
          as: 'client',
          where: Object.keys(clientWhere).length > 0 ? clientWhere : undefined,
          required: Object.keys(clientWhere).length > 0,
          attributes: [],
        },
      ],
      attributes: [
        [Sale.sequelize.fn('SUM', Sale.sequelize.col('Sale.total_value')), 'total_value'],
        [Sale.sequelize.fn('AVG', Sale.sequelize.col('Sale.total_value')), 'avg_value'],
        [Sale.sequelize.fn('COUNT', Sale.sequelize.col('Sale.id')), 'sales_count'],
      ],
      raw: true,
    });

    return summaryResult[0] || { total_value: 0, avg_value: 0, sales_count: 0 };
  }
}

module.exports = new ReportRepository();