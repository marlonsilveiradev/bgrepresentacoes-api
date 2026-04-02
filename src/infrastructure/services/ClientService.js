const { Op } = require('sequelize');
const { sequelize } = require('../repositories/models');
const { Client, User, Flag, ClientFlag, ClientBankAccount, Sale, ClientDocument } = require('../repositories/models');
const { buildClientAccessFilter } = require('../../shared/helpers/accessControl');
const AppError = require('../../shared/utils/AppError');
const logger = require('../../infrastructure/config/logger');
const { sanitizeClientData } = require('../../shared/helpers/clientSanitizer');
const { handleClientDocuments, cleanupDocuments } = require('./ClientDocumentService');
const { ROLES } = require('../../shared/constants/roles');

class ClientService {
  // ========== Métodos públicos ==========

  async listClients(requester, { page = 1, limit = 20, overall_status, benefit_type, partner_id, search } = {}) {
    const offset = (page - 1) * limit;
    const where = this._buildListWhere(requester, { overall_status, benefit_type, partner_id, search });

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
    const filteredRows = this._filterRowsByRole(rows, requester.role);

    return {
      rows: filteredRows,
      count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
    };
  }

  _filterRowsByRole(rows, role) {
    if (role !== 'partner') return rows.map(r => r.get({ plain: true }));

    return rows.map(client => {
      const data = client.get({ plain: true });
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
    });
  }

  async getClientById(id, requester) {
    const accessFilter = buildClientAccessFilter(requester);
    const client = await Client.findOne({
      where: { id, ...accessFilter },
      include: this._defaultIncludes(),
    });

    if (!client) {
      throw new AppError('Cliente não encontrado ou acesso negado.', 404);
    }

    let clientJson = client.toJSON();

    // Aplica formatação comum (download_url nos documentos)
    clientJson = this._formatClientResponse(clientJson);

    // Se for parceiro, aplica filtro de campos
    if (requester.role === ROLES.PARTNER) {
      clientJson = this._filterPartnerClient(clientJson);
    }

    return clientJson;
  }

  _filterPartnerClient(data) {
    const planName = data.sales?.[0]?.plan_name || 'Nenhum plano encontrado';
    return {
      id: data.id,
      protocol: data.protocol,
      corporate_name: data.corporate_name,
      trade_name: data.trade_name,
      responsible_name: data.responsible_name,
      cnpj: data.cnpj,
      phone: data.phone,
      address_street: data.address_street,
      address_number: data.address_number,
      address_complement: data.address_complement,
      address_neighborhood: data.address_neighborhood,
      address_city: data.address_city,
      address_state: data.address_state,
      address_zip: data.address_zip,
      benefit_type: data.benefit_type,
      plan_name: planName,
      overall_status: data.overall_status,
      notes: data.notes,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      clientFlags: data.clientFlags?.map(cf => ({
        id: cf.id,
        status: cf.status,
        origin: cf.origin,
        flag: { name: cf.flag?.name || 'Bandeira' },
      })) || [],
    };
  }

  async updateClient(id, requester, data, files = null) {
    const accessFilter = buildClientAccessFilter(requester);
    const client = await Client.findOne({ where: { id, ...accessFilter } });
    if (!client) {
      throw new AppError('Cliente não encontrado ou acesso negado.', 404);
    }
    this._assertCanWrite(client, requester);

    if (!data) {
      throw new AppError('Dados para atualização não fornecidos.', 400);
    }

    const clientData = sanitizeClientData(data, requester.role);
    const uploadedPublicIds = [];
    const oldPublicIdsToDelete = [];

    const t = await sequelize.transaction();
    try {
      await client.update(clientData, { transaction: t });
      await this._handlePartnerUpdate(client, requester, data, clientData, t);
      await this._handleBankAccountUpdate(id, data.bankAccount, t);
      await this._handleDocumentUpdate(id, files, requester.id, uploadedPublicIds, oldPublicIdsToDelete, t);
      await t.commit();

      // Limpeza assíncrona (fora da transação)
      await cleanupDocuments({ oldPublicIdsToDelete });
      return this.getClientById(id, requester);
    } catch (error) {
      await t.rollback();
      await cleanupDocuments({ uploadedPublicIds });
      throw error;
    }
  }

  async getPublicStatusByProtocol(protocol) {
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
  }

  async recalculateStatus(clientId, transaction = null) {
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
  }

  // ========== Métodos privados ==========

  _defaultIncludes() {
    return [
      { model: User, as: 'creator', attributes: ['id', 'name', 'email', 'role'] },
      { model: User, as: 'partner', attributes: ['id', 'name', 'email'], required: false },
      { model: ClientBankAccount, as: 'bankAccounts' },
      { model: Sale, as: 'sales', order:[['created_at', 'DESC']] },
      { model: ClientDocument, as: 'documents' },
      {
        model: ClientFlag,
        as: 'clientFlags',
        attributes: ['id', 'flag_id', 'status', 'price', 'origin', 'notes', 'analyzed_at', 'approved_at'],
        include: [{ model: Flag, as: 'flag', attributes: ['id', 'name', 'price'] }],
      },
    ];
  }

  _buildListWhere(requester, { overall_status, benefit_type, partner_id, search }) {
    // 1. Escopo de segurança
    let baseFilter = {};
    if (requester.role === 'admin' && partner_id) {
      baseFilter.partner_id = partner_id;
    }
    const securityConditions = buildClientAccessFilter(requester, baseFilter);

    const whereConditions = [securityConditions];

    // 2. Filtros de status/tipo
    if (overall_status) whereConditions.push({ overall_status });
    if (benefit_type) whereConditions.push({ benefit_type });

    // 3. Busca textual
    if (search && search.trim()) {
      whereConditions.push({
        [Op.or]: [
          { corporate_name: { [Op.iLike]: `%${search}%` } },
          { trade_name: { [Op.iLike]: `%${search}%` } },
          { cnpj: { [Op.iLike]: `%${search}%` } },
          { protocol: { [Op.iLike]: `%${search}%` } },
        ],
      });
    }

    return whereConditions.length ? { [Op.and]: whereConditions } : {};
  }

  _assertCanWrite(client, requester) {
    const { id: requesterId, role } = requester;
    if (role === ROLES.ADMIN) return;
    if (role === ROLES.PARTNER) {
      throw new AppError('Parceiros não têm permissão para editar clientes.', 403);
    }
    if (role === ROLES.USER && client.created_by !== requesterId) {
      throw new AppError('Acesso negado: você não é o proprietário deste registro.', 403);
    }
  }

  async _handlePartnerUpdate(client, requester, data, clientData, transaction) {
    if (!Object.prototype.hasOwnProperty.call(data, 'partner_id')) return;

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
      clientData.partner_id = null;
    }
  }

  async _handleBankAccountUpdate(clientId, bankAccount, transaction) {
    if (!bankAccount) return;
    const [account, created] = await ClientBankAccount.findOrCreate({
      where: { client_id: clientId },
      defaults: { ...bankAccount, client_id: clientId },
      transaction,
    });
    if (!created) await account.update(bankAccount, { transaction });
  }

  async _handleDocumentUpdate(clientId, files, requesterId, uploadedPublicIds, oldPublicIdsToDelete, transaction) {
    if (!files) return;
    const result = await handleClientDocuments({
      clientId,
      files,
      requesterId,
      transaction,
    });
    uploadedPublicIds.push(...result.uploadedPublicIds);
    oldPublicIdsToDelete.push(...result.oldPublicIdsToDelete);
  }

  _formatClientResponse(clientJson) {
    if (clientJson.documents?.length) {
      clientJson.documents = clientJson.documents.map(doc => ({
        ...doc,
        download_url: `/api/v1/documents/${doc.id}/download`,
      }));
    }
    return clientJson;
  }
}

// Exporta uma única instância (singleton) para manter compatibilidade
module.exports = new ClientService();