const { Op } = require('sequelize');
const { Client, User, Flag, ClientFlag, ClientBankAccount, Sale, ClientDocument } = require('../models');
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
  const extraFilters = {};

  if (overall_status) extraFilters.overall_status = overall_status;
  if (benefit_type) extraFilters.benefit_type = benefit_type;
  if (requester.role === 'admin' && partner_id) extraFilters.partner_id = partner_id;

  if (search) {
    extraFilters[Op.or] = [
      { corporate_name: { [Op.iLike]: `%${search}%` } },
      { trade_name: { [Op.iLike]: `%${search}%` } },
      { cnpj: { [Op.iLike]: `%${search}%` } },
      { protocol: { [Op.iLike]: `%${search}%` } },
    ];
  }

  const where = { ...extraFilters };
  if (requester.role === 'user') where.created_by = requester.id;
  if (requester.role === 'partner') where.partner_id = requester.id;

  const { rows, count } = await Client.findAndCountAll({
    where,
    include: [
      { model: User, as: 'creator', attributes: ['id', 'name'] },
      { model: User, as: 'partner', attributes: ['id', 'name'], required: false },
    ],
    order: [['created_at', 'DESC']],
    limit,
    offset,
    distinct: true,
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
  const client = await Client.findByPk(id, { include: _defaultIncludes() });
  if (!client) throw new AppError('Cliente não encontrado.', 404);

  if (requester.role === 'user' && client.created_by !== requester.id) throw new AppError('Acesso negado.', 403);
  if (requester.role === 'partner' && client.partner_id !== requester.id) throw new AppError('Acesso negado.', 403);

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
  const client = await Client.findByPk(id);
  if (!client) throw new AppError('Cliente não encontrado.', 404);

  _assertCanWrite(client, requester.id, requester.role);

  const { partner_id, bankAccount, ...clientData } = data || {};
  const uploadedPublicIds = [];
  const oldPublicIdsToDelete = [];

  if (partner_id && requester.role === 'admin') {
    const partner = await User.findByPk(partner_id);
    if (!partner || partner.role !== 'partner') throw new AppError('Parceiro inválido.', 422);
    clientData.partner_id = partner_id;
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
      const toProcess = [];

      if (files.contrato?.length > 0) {
        toProcess.push({ file: files.contrato[0], type: 'company_document' });
      }

      if (files.documentos?.length > 0) {
        const types = ['proof_of_address', 'bank_account_proof', 'card_machine_proof'];
        files.documentos.forEach((file, index) => {
          if (types[index]) toProcess.push({ file, type: types[index] });
        });
      }

      for (const item of toProcess) {
        const { file, type } = item;

        const upload = await StorageService.uploadToCloudinary(file.buffer, `client_${id}_${type}`);
        uploadedPublicIds.push(upload.public_id);

        const existingDoc = await ClientDocument.findOne({
          where: { client_id: id, document_type: type },
          transaction: t,
        });

        if (existingDoc) {
          if (existingDoc.cloudinary_public_id !== upload.public_id) {
            oldPublicIdsToDelete.push(existingDoc.cloudinary_public_id);
          }
          await existingDoc.update({
            cloudinary_public_id: upload.public_id,
            original_name: file.originalname,
            mime_type: file.mimetype,
            file_size: file.size,
          }, { transaction: t });
        } else {
          await ClientDocument.create({
            client_id: id,
            document_type: type,
            cloudinary_public_id: upload.public_id,
            original_name: file.originalname,
            mime_type: file.mimetype,
            file_size: file.size,
            uploaded_by: requester.id,
          }, { transaction: t });
        }
      }
    }

    await t.commit();

    for (const oldId of oldPublicIdsToDelete) {
      StorageService.deleteFromCloudinary(oldId).catch(e => logger.error(`Erro ao remover imagem antiga: ${e}`));
    }

    return getClientById(id, requester);

  } catch (error) {
    await t.rollback();
    for (const newId of uploadedPublicIds) {
      StorageService.deleteFromCloudinary(newId).catch(e => logger.error(`Erro ao limpar upload falho: ${e}`));
    }
    throw error;
  }
};

/**
 * Recalcula e persiste o overall_status do cliente com base nos status das ClientFlags.
 * Exportado para uso pelo SaleService após criar/atualizar/cancelar vendas.
 *
 * Regras (idênticas ao ClientFlagService._syncClientOverallStatus):
 *   - Todas aprovadas                       → 'approved'
 *   - Alguma em analysis ou alguma aprovada → 'analysis'
 *   - Demais casos                          → 'pending'
 *
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
    if (stats[c.status] !== undefined) stats[c.status] = parseInt(c.total, 10);
    stats.total += parseInt(c.total, 10);
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