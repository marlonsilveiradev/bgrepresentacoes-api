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

  // --- Filtragem de segurança para a lista de clientes ---
  let rows = result.rows.map(client => {
  // 1. Força a virar um objeto JS puro e simples
  const data = client.get({ plain: true });

  if (req.user.role === 'partner') {
    
    return {
      id: data.id,
      protocol: data.protocol,
      corporate_name: data.corporate_name,
      trade_name: data.trade_name,
      responsible_name: data.responsible_name,
      phone: data.phone,
      address_city: data.address_city,
      address_state: data.address_state,
      overall_status: data.overall_status,
      benefit_type: data.benefit_type,
      createdAt: data.createdAt,
    };
  }

  return data;
});

  return res.status(200).json({
    status: 'success',
    data: rows,
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
  const data = client.get ? client.get({ plain: true }) : client;  
  
  // 4. Aplica a filtragem se for Parceiro 
  let responseData;
  if (req.user.role === 'partner') {
    // --- Extrair o nome do plano da primeira venda encontrada (se existir) ---
  const planName = data.sales && data.sales.length > 0 
      ? data.sales[0].plan_name 
      : 'Nenhum plano encontrado';
    // RECONSTRUÇÃO TOTAL: Apenas estes campos sairão no JSON do Parceiro
    responseData = {
      id:                 data.id,
      protocol:           data.protocol,
      corporate_name:     data.corporate_name,
      trade_name:         data.trade_name,
      responsible_name:   data.responsible_name,
      cnpj:               data.cnpj,
      phone:              data.phone,
      address_street:     data.address_street,
      address_number:     data.address_number,
      address_complement: data.address_complement,
      address_neighborhood: data.address_neighborhood,
      address_city:       data.address_city,
      address_state:      data.address_state,
      address_zip:        data.address_zip,
      benefit_type:       data.benefit_type,
      plan_name:          planName,
      overall_status:     data.overall_status,
      notes:              data.notes,
      createdAt:          data.createdAt,
      updatedAt:          data.updatedAt,

      clientFlags: data.clientFlags ? data.clientFlags.map(cf => ({
        id: cf.id,
        status: cf.status,
        origin: cf.origin,
        flag: {
          name: cf.flag?.name || 'Bandeira'
        }
      })) : []      
    };
  } else {
    // Se for Admin ou User, envia o objeto completo (ou aplique outra trava se desejar)
    responseData = data;
  }
  console.log('Cliente encontrado:', responseData); // Log para verificar o que será retornado
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