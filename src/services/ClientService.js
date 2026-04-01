const { Op } = require('sequelize');
const { Client, User, Flag, ClientFlag, ClientBankAccount, Sale, ClientDocument } = require('../models');
const { buildClientAccessFilter } = require('../helpers/accessControl');
const AppError = require('../utils/AppError');
const logger = require('../config/logger');
const StorageService = require('./StorageService');

// ─── Include padrão para queries ──────────────────────────────────────────────
const _defaultIncludes = () => [
  { model: User, as: 'creator', attributes: ['id', 'name', 'email', 'role'] },
  { model: User, as: 'partner', attributes: ['id', 'name', 'email'], required: false },
  { model: ClientBankAccount, as: 'bankAccounts' },
  { model: Sale, as: 'sales' },
  { model: ClientDocument, as: 'documents' },
  {
    model: ClientFlag,
    as: 'clientFlags',
    attributes: ['id', 'flag_id', 'status', 'price', 'origin', 'notes', 'analyzed_at', 'approved_at'],
    include: [{ model: Flag, as: 'flag', attributes: ['id', 'name', 'price'] }],
  },
];

// ─── Verificações Auxiliares ──────────────────────────────────────────────────
const _assertCanWrite = (client, requesterId, requesterRole) => {
  if (requesterRole === 'admin') return;
  if (requesterRole === 'partner') {
    throw new AppError('Parceiros não têm permissão para editar dados de clientes.', 403);
  }
  if (requesterRole === 'user' && client.created_by !== requesterId) {
    throw new AppError('Acesso negado: você não é o proprietário deste registro.', 403);
  }
};

// ─── Funções Principais ───────────────────────────────────────────────────────
/**
 * Listagem com filtros e paginação
 */
const listClients = async (requester, { page = 1, limit = 20, overall_status, benefit_type, partner_id, search } = {}) => {
  const offset = (page - 1) * limit;

  // 1. Definição do Escopo de Segurança (Baseado no Role)
  let baseFilter = {};

  if (requester.role === 'admin' && partner_id) {
    baseFilter.partner_id = partner_id;
  }

  const securityConditions = buildClientAccessFilter(requester, baseFilter);

  // 2. Filtros de Status e Tipo
  const filterConditions = {};
  if (overall_status) filterConditions.overall_status = overall_status;
  if (benefit_type) filterConditions.benefit_type = benefit_type;

  // 3. Combinar todas as condições
  const whereConditions = [];

  // Adiciona condições de segurança se não estiver vazias
  whereConditions.push(securityConditions);

  // Adiciona condições de filtro
  if (Object.keys(filterConditions).length > 0) {
    whereConditions.push(filterConditions);
  }

  // 3. Filtro de Busca (Search)
  if (search && search.trim() !== '') {
    whereConditions.push({
      [Op.or]: [
        { corporate_name: { [Op.iLike]: `%${search}%` } },
        { trade_name: { [Op.iLike]: `%${search}%` } },
        { cnpj: { [Op.iLike]: `%${search}%` } },
        { protocol: { [Op.iLike]: `%${search}%` } },
      ]
    });
  }

  // Define o where final
  const where = whereConditions.length > 0
    ? { [Op.and]: whereConditions }
    : {};

  const { rows, count } = await Client.findAndCountAll({
    where,
    include: [
      { model: User, as: 'creator', attributes: ['id', 'name'] },
      { model: User, as: 'partner', attributes: ['id', 'name'], required: false },
    ],
    order: [['created_at', 'DESC']],
    limit,
    offset,
    distinct: true, // Importante para contagem correta com includes
  });

  return {
    rows,
    count,
    totalPages: Math.ceil(count / limit),
    currentPage: page,
  };
};

/**
 * Busca detalhada (Admin/User/Partner)
 */
const getClientById = async (id, requester) => {
  const accessFilter = buildClientAccessFilter(requester);

  const client = await Client.findOne({
    where: {
      id,
      ...accessFilter,
    },
    include: _defaultIncludes(),
  });

  if (!client) {
    throw new AppError('Cliente não encontrado ou acesso negado.', 404);
  }

  const clientJson = client.toJSON();

  if (clientJson.documents?.length > 0) {
    clientJson.documents = clientJson.documents.map(doc => ({
      ...doc,
      download_url: `/api/v1/documents/${doc.id}/download`,
    }));
  }

  return clientJson;
};

/**
 * Edição de dados (Core Management)
 */
const updateClient = async (id, requester, data, files = null) => {
  // Aplica controle de acesso direto na query
  const accessFilter = buildClientAccessFilter(requester);

  const client = await Client.findOne({
    where: {
      id,
      ...accessFilter,
    },
  });

  if (!client) {
    throw new AppError('Cliente não encontrado ou acesso negado.', 404);
  }

  _assertCanWrite(client, requester.id, requester.role);

   if (!data) {
    throw new AppError('Dados para atualização não fornecidos.', 400);
  }

  // Lista de campos permitidos para update
  // Campos que NUNCA podem ser alterados
  const blockedFields = ['cnpj', 'corporate_name', 'email'];

  // Remove campos bloqueados
  const clientData = {};

  for (const key of Object.keys(data)) {
    if (!blockedFields.includes(key)) {
      clientData[key] = data[key];
    }
  }
  const uploadedPublicIds = [];
  const oldPublicIdsToDelete = [];
  const { partner_id, bankAccount } = data || {}; 

  if (data && Object.prototype.hasOwnProperty.call(data, 'partner_id')) {
    // Verifica permissão
    if (requester.role === 'admin' || (requester.role === 'user' && client.created_by === requester.id)) {

      if (partner_id) {
        // Se enviou um ID, valida se o parceiro existe
        const partner = await User.findByPk(partner_id);
        if (!partner || partner.role !== 'partner') {
          throw new AppError('Parceiro inválido.', 422);
        }
        clientData.partner_id = partner_id;
      } else {
        // Se enviou null ou "", define como null para remover do banco
        clientData.partner_id = null;
      }
    }
  } else if (partner_id !== undefined) {
    // Se o campo partner_id está presente mas não é para ser editado, lança erro
    throw new AppError('Você não tem permissão para alterar o parceiro deste cliente.', 403);
  }

  const t = await Client.sequelize.transaction();

  try {
    await client.update(clientData, { transaction: t });

    if (bankAccount) {
      const [account, created] = await ClientBankAccount.findOrCreate({
        where: { client_id: id },
        defaults: { ...bankAccount, client_id: id },
        transaction: t,
      });
      if (!created) await account.update(bankAccount, { transaction: t });
    }

    if (files) {
      const fieldToDocType = {
        'contrato': 'company_document',
        'proof_of_address': 'proof_of_address',
        'bank_account_proof': 'bank_account_proof',
        'card_machine_proof': 'card_machine_proof'
      };

      for (const [fieldName, docType] of Object.entries(fieldToDocType)) {
        if (files[fieldName] && files[fieldName][0]) {
          const file = files[fieldName][0];

          // 1. Upload para o Cloudinary
          const upload = await StorageService.uploadToCloudinary(file.buffer, `client_${id}_${docType}`);
          uploadedPublicIds.push(upload.public_id);

          // 2. Busca se já existe este tipo de documento para o cliente
          const existingDoc = await ClientDocument.findOne({
            where: { client_id: id, document_type: docType },
            transaction: t,
          });

          if (existingDoc) {
            // Guarda o public_id antigo para deletar depois do commit
            if (existingDoc.cloudinary_public_id !== upload.public_id) {
              oldPublicIdsToDelete.push(existingDoc.cloudinary_public_id);
            }

            await existingDoc.update({
              cloudinary_public_id: upload.public_id,
              original_name: file.originalname,
              mime_type: file.mimetype,
              file_size: file.size,
              uploaded_by: requester.id // Log de quem atualizou
            }, { transaction: t });
          } else {
            await ClientDocument.create({
              client_id: id,
              document_type: docType,
              cloudinary_public_id: upload.public_id,
              original_name: file.originalname,
              mime_type: file.mimetype,
              file_size: file.size,
              uploaded_by: requester.id,
            }, { transaction: t });
          }
        }
      }
    }

    await t.commit();

    // Limpeza de arquivos antigos (fora da transação)
    for (const oldId of oldPublicIdsToDelete) {
      StorageService.deleteFromCloudinary(oldId).catch(e => console.error(`Erro ao remover imagem antiga: ${e}`));
    }

    return getClientById(id, requester);

  } catch (error) {
    if (t) await t.rollback();

    // Cleanup de uploads que deram certo mas a transação falhou
    for (const newId of uploadedPublicIds) {
      StorageService.deleteFromCloudinary(newId).catch(e => console.error(`Erro ao limpar upload falho: ${e}`));
    }
    throw error;
  }
};

/**
 * Recalcula e persiste o overall_status do cliente com base nos status das ClientFlags.
 * Exportado para uso pelo SaleService após criar/atualizar/cancelar vendas. 
 * @param {string} clientId
 * @param {object|null} transaction - Transação Sequelize ativa (opcional)
 * @returns {string} Novo status calculado
 */
const recalculateStatus = async (clientId, transaction = null) => {
  const counts = await ClientFlag.findAll({
    where: { client_id: clientId },
    attributes: [
      'status',
      [ClientFlag.sequelize.fn('COUNT', ClientFlag.sequelize.col('id')), 'total'],
    ],
    group: ['status'],
    raw: true,
    transaction,
  });

  const stats = { pending: 0, analysis: 0, approved: 0, total: 0 };
  counts.forEach((c) => {
    if (stats[c.status] !== undefined) stats[c.status] = Number.parseInt(c.total, 10);
    stats.total += Number.parseInt(c.total, 10);
  });

  let newOverallStatus = 'pending';
  if (stats.total > 0 && stats.approved === stats.total) {
    newOverallStatus = 'approved';
  } else if (stats.analysis > 0 || stats.approved > 0) {
    newOverallStatus = 'analysis';
  }

  await Client.update(
    { overall_status: newOverallStatus },
    { where: { id: clientId }, transaction }
  );

  logger.debug({ clientId, newOverallStatus }, 'overall_status recalculado.');
  return newOverallStatus;
};

/**
 * Consulta Pública de Protocolo
 */
const getPublicStatusByProtocol = async (protocol) => {
  const client = await Client.findOne({
    where: { protocol },
    attributes: ['corporate_name', 'created_at', 'overall_status', 'benefit_type', 'notes', 'protocol'],
    include: [{
      model: ClientFlag,
      as: 'clientFlags',
      attributes: ['status'],
      include: [{ model: Flag, as: 'flag', attributes: ['name'] }],
    }],
  });

  if (!client) throw new AppError('O protocolo informado não foi encontrado.', 404);
  return client;
};

module.exports = {
  listClients,
  getClientById,
  getPublicStatusByProtocol,
  updateClient,
  recalculateStatus,
};