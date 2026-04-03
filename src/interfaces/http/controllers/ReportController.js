const GetSalesReportQuery = require('../../../application/queries/GetSalesReportQuery');
const ReportRepository = require('../../../infrastructure/repositories/ReportRepository');
const GetSalesReportInputDTO = require('../../../application/dtos/GetSalesReportInputDTO');
const catchAsync = require('../../../shared/utils/catchAsync');

const reportQuery = new GetSalesReportQuery(ReportRepository);

const salesReport = catchAsync(async (req, res) => {
  const input = new GetSalesReportInputDTO(req.query);
  const result = await reportQuery.execute(input);
  return res.status(200).json(result);
});

module.exports = { salesReport };