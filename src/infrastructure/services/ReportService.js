const { Op } = require('sequelize');
const { Client, Sale, Plan, User, SaleFlag, Flag } = require('../repositories/models');
const logger = require('../../infrastructure/config/logger');

// ─── Utilitário: monta intervalo de datas ─────────────────────────────────────
/**
 * Constrói { start: Date, end: Date } a partir dos filtros recebidos.
 *
 * Prioridade:
 *   1. date_start / date_end → intervalo livre
 *   2. year + month + day   → dia específico
 *   3. year + month         → mês completo
 *   4. year                 → ano completo
 *   5. sem filtro           → retorna null (sem restrição de data)
 */
const _buildDateRange = ({ year, month, day, date_start, date_end }) => {
  // Intervalo livre
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
    const end   = new Date(year, month, 0, 23, 59, 59, 999); // último dia do mês
    return { start, end };
  }

  // Só year
  const start = new Date(year, 0, 1, 0, 0, 0, 0);
  const end   = new Date(year, 11, 31, 23, 59, 59, 999);
  return { start, end };
};

// ─── Relatório principal ──────────────────────────────────────────────────────
/**
 * Retorna relatório de clientes com vendas no período, agrupado por cliente.
 *
 * Estrutura da resposta (preparada para PDF futuro):
 * {
 *   meta:       { generated_at, filters_applied, period_label }
 *   rows:       [ { client, partner, sales: [...], totals } ]
 *   pagination: { total, totalPages, currentPage, perPage }
 *   summary:    { total_clients, total_sales, total_value, average_ticket }
 * }
 *
 * @param {object} filters    - { year, month, day, date_start, date_end, partner_id, overall_status }
 * @param {object} pagination - { page, limit }
 */
// ─── Relatório principal ──────────────────────────────────────────────────────
const getSalesReport = async (queryParams) => {
  // Extrai todos os parâmetros da query (vêm do controller)
  const {
    year, month, day,
    date_start, date_end,
    partner_id,
    overall_status,
    page = 1,
    limit = 20,
  } = queryParams;

  // Converte os valores (a lógica que antes estava no controller agora fica aqui)
  const filters = {
    year: year ? Number.parseInt(year, 10) : undefined,
    month: month ? Number.parseInt(month, 10) : undefined,
    day: day ? Number.parseInt(day, 10) : undefined,
    date_start: date_start || undefined,
    date_end: date_end || undefined,
    partner_id: partner_id || undefined,
    overall_status: overall_status || undefined,
  };

  const pagination = {
    page: Number.parseInt(page, 10),
    limit: Number.parseInt(limit, 10),
  };

  // Desestrutura os objetos filtrados
  const {
    year: yr, month: mo, day: dy,
    date_start: ds, date_end: de,
    partner_id: pid,
    overall_status: os,
  } = filters;

  const { page: pg, limit: lm } = pagination;
  const offset = (pg - 1) * lm;

  // 1. Intervalo de datas
  const dateRange = _buildDateRange({ year: yr, month: mo, day: dy, date_start: ds, date_end: de });

  // 2. Filtros do Client
  const clientWhere = {};
  if (pid) clientWhere.partner_id = pid;
  if (os) clientWhere.overall_status = os;

  // 3. Filtro das Sales (data aplicada aqui)
  const saleWhere = {};
  if (dateRange) {
    saleWhere.created_at = { [Op.between]: [dateRange.start, dateRange.end] };
  }

  // ── Consulta paginada ───────────────────────────────────────────────────────
  const { rows: clients, count } = await Client.findAndCountAll({
    where:    clientWhere,
    attributes: ['id', 'corporate_name', 'overall_status', 'created_at', 'partner_id'],
    include: [
      {
        model:    Sale,
        as:       'sales',
        where:    saleWhere,
        required: true,
        attributes: [
          'id', 'total_value', 'status', 'plan_name', 'plan_price',
          'sold_by', 'created_at', 'approved_at',
        ],
        include: [
          {
            model:      Plan,
            as:         'plan',
            attributes: ['id', 'name', 'price'],
            required:   false,
          },
          {
            model:      SaleFlag,
            as:         'saleFlags',
            attributes: ['flag_id', 'price', 'status'],
            include: [{
              model:      Flag,
              as:         'flag',
              attributes: ['id', 'name'],
            }],
          },
        ],
      },
      {
        model:      User,
        as:         'partner',
        attributes: ['id', 'name', 'email'],
        required:   false,
      },
    ],
    order:    [['created_at', 'DESC']],
    limit:    lm,
    offset:   offset,
    distinct: true,
    subQuery: false,
  });

  // ── Formata as linhas (sem alterações) ─────────────────────────────────────
  const rows = clients.map((client) => {
    const c = client.toJSON();
    const sales = c.sales || [];

    const totalValue = sales.reduce((sum, s) => sum + Number.parseFloat(s.total_value || 0), 0);
    const salesCount = sales.length;
    const latestSale = [...sales].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];

    return {
      client_id:      c.id,
      corporate_name: c.corporate_name,
      overall_status: c.overall_status,
      registered_at:  c.created_at,

      partner: c.partner
        ? { id: c.partner.id, name: c.partner.name, email: c.partner.email }
        : null,

      sales_count:   salesCount,
      total_value:   Number.parseFloat(totalValue.toFixed(2)),
      average_ticket: salesCount > 0
        ? Number.parseFloat((totalValue / salesCount).toFixed(2))
        : 0,

      latest_plan: latestSale?.plan?.name || latestSale?.plan_name || null,

      sales: sales.map((s) => ({
        sale_id:     s.id,
        status:      s.status,
        plan_name:   s.plan?.name || s.plan_name || null,
        total_value: Number.parseFloat(s.total_value || 0),
        created_at:  s.created_at,
        approved_at: s.approved_at || null,
        flags: (s.saleFlags || []).map((sf) => ({
          flag_id:   sf.flag_id,
          flag_name: sf.flag?.name,
          price:     Number.parseFloat(sf.price || 0),
          status:    sf.status,
        })),
      })),
    };
  });

  // ── Consulta de summary ────────────────────────────────────────────────────
  const summaryResult = await Sale.findAll({
    where: saleWhere,
    include: [
      {
        model:    Client,
        as:       'client',
        where:    Object.keys(clientWhere).length > 0 ? clientWhere : undefined,
        required: Object.keys(clientWhere).length > 0,
        attributes: [],
      },
    ],
    attributes: [
      [Sale.sequelize.fn('SUM',   Sale.sequelize.col('Sale.total_value')), 'total_value'],
      [Sale.sequelize.fn('AVG',   Sale.sequelize.col('Sale.total_value')), 'avg_value'],
      [Sale.sequelize.fn('COUNT', Sale.sequelize.col('Sale.id')),          'sales_count'],
    ],
    raw: true,
  });

  const summary = {
    total_clients:  count,
    total_sales:    Number.parseInt(summaryResult[0]?.sales_count || 0, 10),
    total_value:    Number.parseFloat(Number.parseFloat(summaryResult[0]?.total_value || 0).toFixed(2)),
    average_ticket: Number.parseFloat(Number.parseFloat(summaryResult[0]?.avg_value   || 0).toFixed(2)),
  };

  // ── Meta ──────────────────────────────────────────────────────────────────
  const meta = {
    generated_at:   new Date().toISOString(),
    filters_applied: {
      ...(dateRange   && { period_start: dateRange.start, period_end: dateRange.end }),
      ...(pid  && { partner_id: pid }),
      ...(os && { overall_status: os }),
    },
    period_label: _buildPeriodLabel({ year: yr, month: mo, day: dy, date_start: ds, date_end: de }),
  };

  logger.info(
    { filters: queryParams, summary, page: pg, limit: lm },
    'Relatório de vendas gerado.'
  );

  return {
    meta,
    rows,
    pagination: {
      total:       count,
      totalPages:  Math.ceil(count / lm),
      currentPage: pg,
      perPage:     lm,
    },
    summary,
  };
};

// ─── Label legível do período (para cabeçalho do PDF) ────────────────────────
const MONTHS_PT = [
  '', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const _buildPeriodLabel = ({ year, month, day, date_start, date_end }) => {
  if (date_start || date_end) {
    const s = date_start ? new Date(date_start).toLocaleDateString('pt-BR') : '—';
    const e = date_end   ? new Date(date_end).toLocaleDateString('pt-BR')   : '—';
    return `${s} a ${e}`;
  }
  if (!year) return 'Todo o período';
  if (month && day)  return `${String(day).padStart(2, '0')} de ${MONTHS_PT[month]} de ${year}`;
  if (month)         return `${MONTHS_PT[month]} de ${year}`;
  return `Ano ${year}`;
};

module.exports = { getSalesReport };