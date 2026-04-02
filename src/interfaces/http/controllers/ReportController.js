const ReportService = require('../../../infrastructure/services/ReportService')
const catchAsync = require('../../../shared/utils/catchAsync');

const salesReport = catchAsync(async (req, res) => {
  const result = await ReportService.getSalesReport(req.query);
  return res.status(200).json(result);
});

module.exports = {salesReport}