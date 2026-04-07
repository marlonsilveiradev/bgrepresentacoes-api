/**
 * Interface para repositório de relatórios
 * Define o contrato que a infraestrutura deve implementar
 */

const AppError = require('../../shared/utils/AppError')

class IReportRepository {
  async getSalesReportData(filters, pagination) { throw new AppError('Not implemented'); }
  async getSalesReportSummary(filters) { throw new AppError('Not implemented'); }
}

module.exports = IReportRepository;