const { Op } = require('sequelize');
const { sequelize } = require('../repositories/models');
const { Client, User, Flag, ClientFlag, ClientBankAccount, Sale, ClientDocument } = require('../repositories/models');
const { buildClientAccessFilter } = require('../../shared/helpers/accessControl');
const AppError = require('../../shared/utils/AppError');
const logger = require('../../infrastructure/config/logger');
const { sanitizeClientData } = require('../../shared/helpers/clientSanitizer');
const { handleClientDocuments, cleanupDocuments } = require('./ClientDocumentService');
const { ROLES } = require('../../shared/constants/roles');

// Includes padrão reutilizáveis para consultas completas de cliente.
// Centraliza relacionamentos para evitar duplicação e inconsistência.
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
const _assertCanWrite = (client, requester) => {
  const { id: requesterId, role } = requester;
  // Admin pode tudo
  if (role === ROLES.ADMIN) return;
  // Partner nunca pode editar
  if (role === ROLES.PARTNER) {
    throw new AppError('Parceiros não têm permissão para editar clientes.', 403);
  }
  // User só pode editar o que criou
  if (role === ROLES.USER && client.created_by !== requesterId) {
    throw new AppError('Acesso negado: você não é o proprietário deste registro.', 403);
  }
};

// ─── Funções Principais ───────────────────────────────────────────────────────
/**
 * Lista clientes com paginação, filtros e controle de acesso por role.
 * Aplica:
 *  - Escopo de segurança (access control)
 *  - Filtros dinâmicos
 *  - Busca textual
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
 * Retorna um cliente com todos os relacionamentos,
 * respeitando controle de acesso.
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
 * Atualiza dados do cliente com:
 *  - Controle de acesso por role
 *  - Sanitização via whitelist (segurança)
 *  - Transação para consistência
 *  - Upload e substituição de documentos
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

  _assertCanWrite(client, requester);

  if (!data) {
    throw new AppError('Dados para atualização não fornecidos.', 400);
  }

  // Sanitiza os dados com base na whitelist por role (segurança)
  const clientData = sanitizeClientData(data, requester.role);

  const uploadedPublicIds = [];
  const oldPublicIdsToDelete = [];
  const { partner_id, bankAccount } = data || {};

  // ─── Controle seguro de alteração de partner_id ─────────────────────────────
if (Object.prototype.hasOwnProperty.call(data, 'partner_id')) {

  const canEditPartner =
    requester.role === ROLES.ADMIN ||
    (requester.role === ROLES.USER && client.created_by === requester.id);

  if (!canEditPartner) {
    throw new AppError('Você não tem permissão para alterar o parceiro deste cliente.', 403);
  }

  if (data.partner_id) {
    const partner = await User.findByPk(data.partner_id);

    if (!partner || partner.role !== ROLES.PARTNER) {
      throw new AppError('Parceiro inválido.', 422);
    }

    clientData.partner_id = data.partner_id;
  } else {
    // Permite remover parceiro
    clientData.partner_id = null;
  }
}

  const t = await sequelize.transaction();

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
      const result = await handleClientDocuments({
        clientId: id,
        files,
        requesterId: requester.id,
        transaction: t,
      });

      uploadedPublicIds.push(...result.uploadedPublicIds);
      oldPublicIdsToDelete.push(...result.oldPublicIdsToDelete);
    }

    await t.commit();

    // Limpeza de arquivos antigos (fora da transação)
    await cleanupDocuments({ oldPublicIdsToDelete });

    return getClientById(id, requester);

  } catch (error) {
    if (t) await t.rollback();

    // Cleanup de uploads que deram certo mas a transação falhou
    await cleanupDocuments({ uploadedPublicIds });
    throw error;
  }
};

/**
 * Recalcula o status geral do cliente com base nas flags associadas.
 * Usado após alterações em vendas/flags. 
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