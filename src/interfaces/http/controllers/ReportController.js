const ReportService = require('../../../infrastructure/services/ReportService')

const salesReport = catchAsync(async (req, res) => {
  const result = await ReportService.getSalesReport(req.query);
  return res.status(200).json(result);
});