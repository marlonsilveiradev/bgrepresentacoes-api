class GetSalesReportInputDTO {
  constructor(queryParams) {
    this.year = queryParams.year ? Number.parseInt(queryParams.year, 10) : undefined;
    this.month = queryParams.month ? Number.parseInt(queryParams.month, 10) : undefined;
    this.day = queryParams.day ? Number.parseInt(queryParams.day, 10) : undefined;
    this.date_start = queryParams.date_start || undefined;
    this.date_end = queryParams.date_end || undefined;
    this.partner_id = queryParams.partner_id || undefined;
    this.overall_status = queryParams.overall_status || undefined;
    this.page = queryParams.page ? Number.parseInt(queryParams.page, 10) : 1;
    this.limit = queryParams.limit ? Number.parseInt(queryParams.limit, 10) : 20;
  }
}
module.exports = GetSalesReportInputDTO;