const logger = require('../../infrastructure/config/logger');

const MONTHS_PT = [
  '', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

class GetSalesReportQuery {
  constructor(reportRepository) {
    this.reportRepository = reportRepository;
  }

  async execute(inputDTO) {
    // 1. Extrai os dados do DTO (já parseados)
    const {
      year, month, day,
      date_start, date_end,
      partner_id, overall_status,
      page, limit
    } = inputDTO;

    const filters = { year, month, day, date_start, date_end, partner_id, overall_status };
    const pagination = { page, limit };

    // 2. Busca dados crus
    const { rows, count } = await this.reportRepository.getSalesReportData(filters, pagination);
    const summaryRaw = await this.reportRepository.getSalesReportSummary(filters);

    // 3. Formata a resposta
    const formattedRows = this._formatRows(rows);
    const summary = this._formatSummary(summaryRaw, count);
    const meta = this._buildMeta(filters);

    logger.info({ filters: inputDTO, summary, page, limit }, 'Relatório de vendas gerado.');

    return {
      meta,
      rows: formattedRows,
      pagination: {
        total: count,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        perPage: limit,
      },
      summary,
    };
  }

  _formatRows(clients) {
    return clients.map(client => {
      const c = client.toJSON();
      const sales = c.sales || [];
      const totalValue = sales.reduce((sum, s) => sum + Number.parseFloat(s.total_value || 0), 0);
      const salesCount = sales.length;
      const latestSale = [...sales].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];

      return {
        client_id: c.id,
        corporate_name: c.corporate_name,
        overall_status: c.overall_status,
        registered_at: c.created_at,
        partner: c.partner ? { id: c.partner.id, name: c.partner.name, email: c.partner.email } : null,
        sales_count: salesCount,
        total_value: Number.parseFloat(totalValue.toFixed(2)),
        average_ticket: salesCount > 0 ? Number.parseFloat((totalValue / salesCount).toFixed(2)) : 0,
        latest_plan: latestSale?.plan?.name || latestSale?.plan_name || null,
        sales: sales.map(s => ({
          sale_id: s.id,
          status: s.status,
          plan_name: s.plan?.name || s.plan_name || null,
          total_value: Number.parseFloat(s.total_value || 0),
          created_at: s.created_at,
          approved_at: s.approved_at || null,
          flags: (s.saleFlags || []).map(sf => ({
            flag_id: sf.flag_id,
            flag_name: sf.flag?.name,
            price: Number.parseFloat(sf.price || 0),
            status: sf.status,
          })),
        })),
      };
    });
  }

  _formatSummary(summaryRaw, totalClients) {
    return {
      total_clients: totalClients,
      total_sales: Number.parseInt(summaryRaw.sales_count || 0, 10),
      total_value: Number.parseFloat(Number.parseFloat(summaryRaw.total_value || 0).toFixed(2)),
      average_ticket: Number.parseFloat(Number.parseFloat(summaryRaw.avg_value || 0).toFixed(2)),
    };
  }

  _buildMeta(filters, queryParams) {
    const dateRange = this._buildDateRangeForMeta(filters);
    const periodLabel = this._buildPeriodLabel(filters);

    return {
      generated_at: new Date().toISOString(),
      filters_applied: {
        ...(dateRange && { period_start: dateRange.start, period_end: dateRange.end }),
        ...(filters.partner_id && { partner_id: filters.partner_id }),
        ...(filters.overall_status && { overall_status: filters.overall_status }),
      },
      period_label: periodLabel,
    };
  }

  _buildDateRangeForMeta(filters) {
    const { year, month, day, date_start, date_end } = filters;
    if (date_start || date_end) {
      const start = date_start ? new Date(date_start) : null;
      const end = date_end ? new Date(date_end) : null;
      return start || end ? { start, end } : null;
    }
    if (!year) return null;
    if (month && day) {
      return { start: new Date(year, month - 1, day), end: new Date(year, month - 1, day) };
    }
    if (month) {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0);
      return { start, end };
    }
    return { start: new Date(year, 0, 1), end: new Date(year, 11, 31) };
  }

  _buildPeriodLabel({ year, month, day, date_start, date_end }) {
    if (date_start || date_end) {
      const s = date_start ? new Date(date_start).toLocaleDateString('pt-BR') : '—';
      const e = date_end ? new Date(date_end).toLocaleDateString('pt-BR') : '—';
      return `${s} a ${e}`;
    }
    if (!year) return 'Todo o período';
    if (month && day) return `${String(day).padStart(2, '0')} de ${MONTHS_PT[month]} de ${year}`;
    if (month) return `${MONTHS_PT[month]} de ${year}`;
    return `Ano ${year}`;
  }
}

module.exports = GetSalesReportQuery;