/**
 * Interface para repositório de relatórios
 * Define o contrato que a infraestrutura deve implementar
 */
class IReportRepository {
  async getSalesReportData(filters, pagination) { throw new Error('Not implemented'); }
  async getSalesReportSummary(filters) { throw new Error('Not implemented'); }
}

module.exports = IReportRepository;