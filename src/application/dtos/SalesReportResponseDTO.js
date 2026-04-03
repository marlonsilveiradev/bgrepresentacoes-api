class SalesReportResponseDTO {
  constructor({ meta, rows, pagination, summary }) {
    this.meta = meta;
    this.rows = rows;
    this.pagination = pagination;
    this.summary = summary;
  }
}
module.exports = SalesReportResponseDTO;