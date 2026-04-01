const ReportService = require('../../../infrastructure/services/ReportService');

/**
 * Controller de Relatórios.
 * Thin layer: parse dos query params → chama Service → devolve resposta formatada.
 *
 * Todos os endpoints requerem role: 'admin' (aplicado na rota via authorize).
 */

/**
 * GET /api/v1/reports/sales
 *
 * Query params:
 *   year, month, day          — filtro por período
 *   date_start, date_end      — intervalo livre (alternativa ao year/month/day)
 *   partner_id                — filtro por parceiro do cliente
 *   overall_status            — filtro por status do cliente
 *   page, limit               — paginação
 */
const salesReport = async (req, res, next) => {
  try {
    const {
      year, month, day,
      date_start, date_end,
      partner_id,
      overall_status,
      page,
      limit,
    } = req.query;

    const filters = {
      year:           year   ? Number.parseInt(year, 10)   : undefined,
      month:          month  ? Number.parseInt(month, 10)  : undefined,
      day:            day    ? Number.parseInt(day, 10)    : undefined,
      date_start:     date_start || undefined,
      date_end:       date_end   || undefined,
      partner_id:     partner_id || undefined,
      overall_status: overall_status || undefined,
    };

    const pagination = {
      page:  page  ? Number.parseInt(page, 10)  : 1,
      limit: limit ? Number.parseInt(limit, 10) : 20,
    };

    const result = await ReportService.getSalesReport(filters, pagination);

    return res.status(200).json(result);
  } catch (err) {
    return next(err);
  }
};

module.exports = { salesReport };