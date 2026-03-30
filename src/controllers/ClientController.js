const ClientService = require('../services/ClientService');
const catchAsync = require('../utils/catchAsync');

// GET /api/v1/clients
const list = catchAsync(async (req, res, next) => {
  const { page, limit, overall_status, benefit_type, partner_id, search } = req.query;

  const result = await ClientService.listClients(req.user, {
    page:           page  ? Number.parseInt(page, 10)  : 1,
    limit:          limit ? Number.parseInt(limit, 10) : 20,
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
      perPage:     Number.parseInt(limit, 10) || 20,
    },
  });
});

// GET /api/v1/clients/:id
const getById = catchAsync(async (req, res, next) => {
  // 1. Busca o cliente no Service
  const client = await ClientService.getClientById(req.params.id, req.user);
  
  // 2. VERIFICAÇÃO CRÍTICA: Se não houver cliente, retorna 404 imediatamente
  if (!client) {
    return res.status(404).json({ 
      status: 'error', 
      message: 'Cliente não encontrado ou você não tem permissão para visualizá-lo.' 
    });
  }

  // 3. Converte para objeto simples de forma segura
  // O método .get({ plain: true }) é o mais estável do Sequelize para isso
  let responseData = client.get ? client.get({ plain: true }) : structuredClone(client);

  // 4. Aplica a filtragem se for Parceiro
  if (req.user.role === 'partner') {
    const sensitiveFields = [
      'bankAccounts', 
      'documents', 
      'state_registration', 
      'creator', 
      'created_by'
    ];

    sensitiveFields.forEach(field => delete responseData[field]);
  }

  // 5. Retorno com sucesso
  return res.status(200).json({ 
    status: 'success',
    data: responseData 
  });
});

// PATCH /api/v1/clients/:id
const updateClient = catchAsync(async (req, res) => {
  const rawFiles = req.files || []; 
  
  // Se vier no formato do FormData (com campo 'data' stringificado), faz o parse.
  // Se não, usa o req.body normal.
  let updateData = req.body;
  if (req.body.data && typeof req.body.data === 'string') {
    try {
      updateData = JSON.parse(req.body.data);
    } catch (err) {
      console.error('Erro ao processar FormData JSON:', err.message);
      return res.status(400).json({ status: 'error', message: 'JSON malformado no campo data' });
    }
  }

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