const ClientFlagService = require('../../../infrastructure/services/ClientFlagService');
const catchAsync = require('../../../shared/utils/catchAsync');

const updateStatus = catchAsync(async (req, res, next) => {
  const { id } = req.params; // ID do vínculo (ClientFlag)
  const { status, notes } = req.body;
  const requester = req.user;

  const updatedFlag = await ClientFlagService.updateFlagStatus(id, requester, { 
    status, 
    notes 
  });

  return res.status(200).json({
    status: 'success',
    message: `Status da bandeira atualizado para ${status}.`,
    data: updatedFlag
  });
});

module.exports = { updateStatus };