const ClientService = require('../services/ClientService');
const catchAsync = require('../utils/catchAsync');

// GET /api/v1/clients
const list = catchAsync(async (req, res, next) => {
  const { page, limit, overall_status, benefit_type, partner_id, search } = req.query;

  const result = await ClientService.listClients(req.user, {
    page:           page  ? parseInt(page, 10)  : 1,
    limit:          limit ? parseInt(limit, 10) : 20,
    overall_status,
    benefit_type,
    partner_id,
    search,
  });

  return res.status(200).json({
    status: 'success',
    data: result.rows,
    pagination: {
      total:       result.count,
      totalPages:  result.totalPages,
      currentPage: result.currentPage,
      perPage:     parseInt(limit, 10) || 20,
    },
  });
});

// GET /api/v1/clients/:id
const getById = catchAsync(async (req, res, next) => {
  const client = await ClientService.getClientById(req.params.id, req.user);
  
  return res.status(200).json({ 
    status: 'success',
    data: client 
  });
});

// POST /api/v1/clients
// const create = catchAsync(async (req, res, next) => {
//   const client = await ClientService.createClient(req.user, req.body);
  
//   return res.status(201).json({
//     status: 'success',
//     message: `Cliente cadastrado com protocolo ${client.protocol}.`,
//     data:    client,
//   });
// });


// PATCH /api/v1/clients/:id
const updateClient = catchAsync(async (req, res) => {
  const rawFiles = req.files || [];
 
  // --- ADICIONE ESTE BLOCO ---
  // Se vier no formato do FormData (com campo 'data' stringificado), faz o parse.
  // Se não, usa o req.body normal.
  let updateData = req.body;
  if (req.body.data && typeof req.body.data === 'string') {
    try {
      updateData = JSON.parse(req.body.data);
    } catch (err) {
      return res.status(400).json({ status: 'error', message: 'JSON malformado no campo data' });
    }
  }
  // ---------------------------

  const organizedFiles = rawFiles.length > 0
    ? {
        contrato:   rawFiles.filter(f => f.fieldname.trim() === 'contrato'),
        documentos: rawFiles.filter(f => f.fieldname.trim() === 'documentos'),
      }
    : null;
 
  const client = await ClientService.updateClient(
    req.params.id,
    req.user,
    updateData, // <--- Agora usamos o dado tratado
    organizedFiles
  );
 
  return res.status(200).json({
    status:  'success',
    message: 'Cliente atualizado com sucesso.',
    data:    client,
  });
});
// const updateClient = catchAsync(async (req, res) => {
//   const rawFiles = req.files || [];
 
//   // Organiza o array plano do multer no formato esperado pelo service
//   // Se não vieram arquivos, passa null para o service pular o bloco de upload
//   const organizedFiles = rawFiles.length > 0
//     ? {
//         contrato:   rawFiles.filter(f => f.fieldname.trim() === 'contrato'),
//         documentos: rawFiles.filter(f => f.fieldname.trim() === 'documentos'),
//       }
//     : null;
 
//   const client = await ClientService.updateClient(
//     req.params.id,
//     req.user,
//     req.body,
//     organizedFiles
//   );
 
//   return res.status(200).json({
//     status:  'success',
//     message: 'Cliente atualizado com sucesso.',
//     data:    client,
//   });
// });


// GET /api/v1/clients/public/track/:protocol
const trackByProtocol = catchAsync(async (req, res, next) => {
  const { protocol } = req.params;
  
  // Se o serviço lançar o AppError, o catchAsync vai capturar
  const client = await ClientService.getPublicStatusByProtocol(protocol);
  
  return res.status(200).json({
    status: 'success',
    data: client
  });
});

module.exports = { list, getById, updateClient, trackByProtocol };