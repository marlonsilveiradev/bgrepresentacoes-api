const DocumentService = require('../../../infrastructure/services/DocumentService');
const catchAsync = require('../../../shared/utils/catchAsync');

const download = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { buffer, contentType, filename } = await DocumentService.downloadDocument(id, req.user);

  const safeFilename = encodeURIComponent(filename);
  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Length', buffer.length);
  res.setHeader('Content-Disposition', `inline; filename="${safeFilename}"`);
  res.setHeader('Cache-Control', 'private, no-store');

  res.end(buffer);
});

module.exports = { download };