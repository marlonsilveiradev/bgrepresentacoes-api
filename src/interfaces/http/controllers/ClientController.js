const ClientService = require('../../../infrastructure/services/ClientService');
const catchAsync = require('../../../shared/utils/catchAsync');

// GET /api/v1/clients
const list = catchAsync(async (req, res) => {
  const { page = 1, limit = 20, overall_status, benefit_type, partner_id, search } = req.query;
  const result = await ClientService.listClients(req.user, {
    page,
    limit,
    overall_status,
    benefit_type,
    partner_id,
    search,
  });

  return res.status(200).json({
    status: 'success',
    data: result.rows,
    pagination: {
      total: result.count,
      totalPages: result.totalPages,
      currentPage: result.currentPage,
      perPage: Number.parseInt(limit, 10) || 20,
    },
  });
});

// GET /api/v1/clients/:id
const getById = catchAsync(async (req, res) => {
  const client = await ClientService.getClientById(req.params.id, req.user);
  return res.status(200).json({
    status: 'success',
    data: client,
  });
});

// PATCH /api/v1/clients/:id
const updateClient = catchAsync(async (req, res) => {
  const updateData = req.body;
  const organizedFiles = req.files && Object.keys(req.files).length > 0 ? req.files : null;

  const client = await ClientService.updateClient(
    req.params.id,
    req.user,
    updateData,
    organizedFiles
  );

  return res.status(200).json({
    status: 'success',
    message: 'Cliente atualizado com sucesso.',
    data: client,
  });
});

// GET /api/v1/clients/public/track/:protocol
const trackByProtocol = catchAsync(async (req, res) => {
  const { protocol } = req.params;
  const client = await ClientService.getPublicStatusByProtocol(protocol);
  return res.status(200).json({
    status: 'success',
    data: client,
  });
});

module.exports = { list, getById, updateClient, trackByProtocol };