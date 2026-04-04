const { Op } = require('sequelize');
const { Sale, SaleFlag, Client, Plan, Flag, User } = require('../repositories/models');
const { recalculateStatus } = require('./ClientService');
const AppError = require('../../shared/utils/AppError');
const logger = require('../../infrastructure/config/logger');

class SaleService {
  // Métodos privados
  _defaultIncludes() {
    return [
      {
        model: Client,
        as: 'client',
        attributes: ['id', 'protocol', 'corporate_name', 'cnpj', 'overall_status'],
      },
      {
        model: Plan,
        as: 'plan',
        attributes: ['id', 'name', 'price'],
        required: false,
      },
      {
        model: User,
        as: 'seller',
        attributes: ['id', 'name', 'email'],
      },
      {
        model: User,
        as: 'partner',
        attributes: ['id', 'name', 'email'],
        required: false,
      },
      {
        model: SaleFlag,
        as: 'saleFlags',
        attributes: ['id', 'sale_id', 'flag_id', 'status', 'price'],
        paranoid: false,
        include: [{
          model: Flag,
          as: 'flag',
          attributes: ['id', 'name'],
        }],
      },
    ];
  }

  async _assertClientOwnership(clientId, requester, { transaction = null } = {}) {
    const client = await Client.findByPk(clientId, {
      transaction,
      attributes: ['id', 'created_by', 'partner_id'],
    });
    if (!client) throw new AppError('Cliente não encontrado.', 404);
    if (requester.role === 'partner') {
      throw new AppError('Parceiros não podem registrar vendas.', 403);
    }
    if (requester.role === 'user' && client.created_by !== requester.id) {
      throw new AppError('Você só pode registrar vendas para clientes que cadastrou.', 403);
    }
    return client;
  }

  async _getPlanWithFlags(planId, transaction) {
    const plan = await Plan.findByPk(planId, {
      transaction,
      attributes: ['id', 'name', 'price', 'is_active'],
      include: [{
        model: Flag,
        as: 'flags',
        attributes: ['id', 'name', 'price', 'is_active'],
        through: { attributes: [] },
      }],
    });
    if (!plan) throw new AppError('Plano não encontrado.', 404);
    if (!plan.is_active) throw new AppError('Plano inativo. Selecione um plano ativo.', 422);
    return plan;
  }

  async _getFlagsByIds(flagIds, transaction) {
    const flags = await Flag.findAll({
      where: { id: { [Op.in]: flagIds }, is_active: true },
      attributes: ['id', 'name', 'price'],
      transaction,
    });
    if (flags.length !== flagIds.length) {
      const foundIds = flags.map(f => f.id);
      const missing = flagIds.filter(id => !foundIds.includes(id));
      throw new AppError(`Bandeira(s) não encontrada(s) ou inativa(s): ${missing.join(', ')}`, 422);
    }
    return flags;
  }

  // Métodos públicos
  async listSales(requester, { page = 1, limit = 20, status, client_id, sold_by, plan_id } = {}) {
    const offset = (page - 1) * limit;
    const where = {};

    if (requester.role === 'user') where.sold_by = requester.id;
    if (requester.role === 'partner') where.partner_id = requester.id;

    if (status) where.status = status;
    if (client_id) where.client_id = client_id;
    if (plan_id) where.plan_id = plan_id;
    if (requester.role === 'admin' && sold_by) where.sold_by = sold_by;

    const { rows, count } = await Sale.findAndCountAll({
      where,
      include: this._defaultIncludes(),
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
  }

  async getSaleById(id, requester) {
    const sale = await Sale.findByPk(id, { include: this._defaultIncludes() });
    if (!sale) throw new AppError('Venda não encontrada.', 404);
    if (requester.role === 'user' && sale.sold_by !== requester.id) {
      throw new AppError('Acesso negado.', 403);
    }
    if (requester.role === 'partner' && sale.partner_id !== requester.id) {
      throw new AppError('Acesso negado.', 403);
    }
    return sale;
  }

  async createSale(requester, { client_id, plan_id, flag_ids = [], notes, partner_id }, { transaction = null } = {}) {
    const client = await this._assertClientOwnership(client_id, requester, { transaction });

    let plan = null;
    let flags = [];
    const hasExplicitFlags = Array.isArray(flag_ids) && flag_ids.length > 0;

    if (plan_id) {
      plan = await this._getPlanWithFlags(plan_id, transaction);
    }

    if (hasExplicitFlags) {
      flags = await this._getFlagsByIds(flag_ids, transaction);
    } else if (plan) {
      flags = (plan.flags || []).filter(f => f.is_active);
      if (flags.length === 0) {
        throw new AppError(
          'O plano selecionado não possui bandeiras ativas vinculadas. Informe flag_ids manualmente.',
          422
        );
      }
      logger.debug({ planId: plan_id, inheritedFlags: flags.map(f => f.id) }, 'Bandeiras herdadas do plano.');
    } else {
      throw new AppError('Informe ao menos um plano (plan_id) ou uma lista de bandeiras (flag_ids).', 422);
    }

    let total_value;
    let plan_name = null;
    let plan_price = null;
    let resolvedPlanId = null;

    if (plan) {
      total_value = Number.parseFloat(plan.price);
      plan_name = plan.name;
      plan_price = plan.price;
      resolvedPlanId = plan.id;
    } else {
      total_value = flags.reduce((sum, f) => sum + Number.parseFloat(f.price), 0);
    }

    let sale;
    try {
      sale = await Sale.create({
        client_id,
        plan_id: resolvedPlanId,
        plan_name,
        plan_price,
        total_value,
        status: 'pending',
        sold_by: requester.id,
        partner_id: partner_id || client.partner_id,
        notes: notes || null,
      }, { transaction });
    } catch (error) {
      logger.error({ err: error }, 'Falha ao criar venda.');
      throw error;
    }

    const saleFlagsData = flags.map(f => ({
      sale_id: sale.id,
      flag_id: f.id,
      status: 'pending',
      price: Number(f.price),
    }));

    if (saleFlagsData.length > 0) {
      try {
        await SaleFlag.bulkCreate(saleFlagsData, {
          transaction,
          ignoreDuplicates: true,
          returning: false,
        });
      } catch (error) {
        logger.error({ err: error }, 'Falha ao salvar bandeiras da venda.');
        throw new AppError('Erro ao salvar bandeiras da venda. Tente novamente.', 500);
      }
    }

    await recalculateStatus(client_id);

    logger.info({
      saleId: sale.id,
      clientId: client_id,
      soldBy: requester.id,
      scenario: plan ? (hasExplicitFlags ? 'combo-override' : 'combo-auto') : 'avulso',
      flags: flags.length,
      total: total_value,
    }, 'Venda registrada.');

    if (transaction) return sale;
    return this.getSaleById(sale.id, requester);
  }

  async updateSaleStatus(id, requester, { status, notes }) {
    const sale = await Sale.findByPk(id, { attributes: ['id', 'status', 'client_id', 'notes'] });
    if (!sale) throw new AppError('Venda não encontrada.', 404);
    if (sale.status === 'approved') {
      throw new AppError('Venda aprovada não pode ter o status alterado.', 409);
    }
    if (sale.status === 'cancelled') {
      throw new AppError('Venda cancelada não pode ser reaberta.', 409);
    }

    const updateData = { status };
    if (notes !== undefined) updateData.notes = notes;
    if (status === 'approved') updateData.approved_at = new Date();

    await sale.update(updateData);
    await recalculateStatus(sale.client_id);

    logger.info({ saleId: id, oldStatus: sale.status, newStatus: status, by: requester.id }, 'Status da venda atualizado.');
    return this.getSaleById(id, requester);
  }

  async cancelSale(id, requester, { notes } = {}) {
    const sale = await Sale.findByPk(id, { attributes: ['id', 'status', 'sold_by', 'client_id'] });
    if (!sale) throw new AppError('Venda não encontrada.', 404);
    if (requester.role === 'user' && sale.sold_by !== requester.id) {
      throw new AppError('Você só pode cancelar as próprias vendas.', 403);
    }
    if (sale.status === 'approved') {
      throw new AppError('Venda aprovada não pode ser cancelada.', 409);
    }
    if (sale.status === 'cancelled') {
      throw new AppError('Venda já está cancelada.', 409);
    }

    await sale.update({ status: 'cancelled', notes: notes || sale.notes });
    await recalculateStatus(sale.client_id);

    logger.info({ saleId: id, cancelledBy: requester.id }, 'Venda cancelada.');
    return this.getSaleById(id, requester);
  }
}

module.exports = new SaleService();