const AppError = require('../../../shared/utils/AppError');
const logger = require('../../../infrastructure/config/logger');
const { ROLES } = require('../../../shared/constants/roles');

class CreateSaleUseCase {
  constructor(
    saleRepository,
    saleFlagRepository,
    clientRepository,
    planRepository,
    flagRepository,
    clientFlagRepository,
    sequelize
  ) {
    this.saleRepository = saleRepository;
    this.saleFlagRepository = saleFlagRepository;
    this.clientRepository = clientRepository;
    this.planRepository = planRepository;
    this.flagRepository = flagRepository;
    this.clientFlagRepository = clientFlagRepository;
    this.sequelize = sequelize;
  }

  async execute(requester, { client_id, plan_id, flag_ids = [], notes, partner_id }) {
    const transactionId = `sale-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    try {
      logger.info(
        { transactionId, clientId: client_id, userId: requester.id },
        '[CreateSaleUseCase] Iniciando criação de venda'
      );

      // ✅ PASSO 1: Validar cliente
      const client = await this._assertClientOwnership(client_id, requester);

      // ✅ PASSO 2: Validar plano e/ou bandeiras
      let plan = null;
      let flags = [];
      const hasExplicitFlags = Array.isArray(flag_ids) && flag_ids.length > 0;

      if (plan_id) {
        plan = await this._getPlanWithFlags(plan_id);
      }

      if (hasExplicitFlags) {
        flags = await this._getFlagsByIds(flag_ids);
      } else if (plan) {
        flags = (plan.flags || []).filter(f => f.is_active);
        
        if (flags.length === 0) {
          throw new AppError(
            'O plano selecionado não possui bandeiras ativas vinculadas. Informe flag_ids manualmente.',
            422,
            'NO_ACTIVE_FLAGS'
          );
        }

        logger.debug(
          { transactionId, planId: plan_id, inheritedFlags: flags.map(f => f.id) },
          '[CreateSaleUseCase] Bandeiras herdadas do plano'
        );
      } else {
        throw new AppError(
          'Informe ao menos um plano (plan_id) ou uma lista de bandeiras (flag_ids).',
          422,
          'MISSING_PLAN_OR_FLAGS'
        );
      }

      // ✅ PASSO 3: Calcular valor total
      const { totalValue, planName, planPrice, resolvedPlanId } = this._calculateTotalValue(
        plan,
        flags
      );

      // ✅ PASSO 4: Transação para criar venda + bandeiras + atualizar cliente
      const transaction = await this.sequelize.transaction();

      try {
        // Criar venda
        const sale = await this.saleRepository.create(
          {
            client_id,
            plan_id: resolvedPlanId,
            plan_name: planName,
            plan_price: planPrice,
            total_value: totalValue,
            status: 'pending',
            sold_by: requester.id,
            partner_id: partner_id || client.partner_id,
            notes: notes || null,
          },
          { transaction }
        );

        // Associar bandeiras à venda
        if (flags.length > 0) {
          const saleFlagsData = flags.map(f => ({
            sale_id: sale.id,
            flag_id: f.id,
            status: 'pending',
            price: Number(f.price),
          }));

          await this.saleFlagRepository.bulkCreate(saleFlagsData, { transaction });

          // Também associar bandeiras ao cliente
          const clientFlagsData = flags.map(f => ({
            client_id,
            flag_id: f.id,
            status: 'pending',
            origin: 'individual',
          }));

          await this.clientFlagRepository.bulkCreate(clientFlagsData, { transaction });
        }

        // Sincronizar status do cliente
        await this._syncClientOverallStatus(client_id, transaction);

        await transaction.commit();

        logger.info(
          {
            transactionId,
            saleId: sale.id,
            clientId: client_id,
            totalValue,
            flagCount: flags.length,
          },
          '[CreateSaleUseCase] Venda criada com sucesso'
        );

        return sale;

      } catch (error) {
        await transaction.rollback();
        logger.error(
          { transactionId, error: error.message },
          '[CreateSaleUseCase] Transação desfeita'
        );
        throw error;
      }

    } catch (error) {
      if (error instanceof AppError) throw error;

      logger.error(
        { transactionId, clientId: client_id, error: error.message },
        '[CreateSaleUseCase] Erro ao criar venda'
      );

      throw new AppError('Erro ao criar venda', 500, 'SALE_CREATION_ERROR');
    }
  }

  async _assertClientOwnership(clientId, requester) {
    const client = await this.clientRepository.findById(clientId);

    if (!client) {
      throw new AppError('Cliente não encontrado.', 404, 'CLIENT_NOT_FOUND');
    }

    const isAdmin = requester.role === ROLES.ADMIN;
    const isOwner = client.created_by === requester.id;

    if (!isAdmin && !isOwner) {
      throw new AppError(
        'Você não tem permissão para criar vendas para este cliente.',
        403,
        'CLIENT_ACCESS_DENIED'
      );
    }

    return client;
  }

  async _getPlanWithFlags(planId) {
    const plan = await this.planRepository.findByIdWithFlags(planId);

    if (!plan) {
      throw new AppError(
        'O plano selecionado é inválido ou não está mais ativo.',
        422,
        'PLAN_NOT_FOUND'
      );
    }

    if (!plan.is_active) {
      throw new AppError(
        'O plano selecionado está inativo.',
        422,
        'PLAN_INACTIVE'
      );
    }

    return plan;
  }

  async _getFlagsByIds(flagIds) {
    const flags = await this.flagRepository.findActiveByIds(flagIds);

    if (flags.length !== flagIds.length) {
      const foundIds = flags.map(f => f.id);
      const missing = flagIds.filter(id => !foundIds.includes(id));

      throw new AppError(
        `Bandeira(s) não encontrada(s) ou inativa(s): ${missing.join(', ')}`,
        422,
        'FLAGS_NOT_FOUND'
      );
    }

    return flags;
  }

  _calculateTotalValue(plan, flags) {
    let totalValue;
    let planName = null;
    let planPrice = null;
    let resolvedPlanId = null;

    if (plan) {
      totalValue = Number.parseFloat(plan.price);
      planName = plan.name;
      planPrice = plan.price;
      resolvedPlanId = plan.id;
    } else {
      totalValue = flags.reduce((sum, f) => sum + Number.parseFloat(f.price), 0);
    }

    return { totalValue, planName, planPrice, resolvedPlanId };
  }

  async _syncClientOverallStatus(clientId, transaction) {
    const ClientFlag = this.clientFlagRepository.model;
    
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

    counts.forEach(c => {
      stats[c.status] = Number.parseInt(c.total, 10);
      stats.total += Number.parseInt(c.total, 10);
    });

    let newOverallStatus = 'pending';

    if (stats.approved === stats.total && stats.total > 0) {
      newOverallStatus = 'approved';
    } else if (stats.analysis > 0 || stats.approved > 0) {
      newOverallStatus = 'analysis';
    }

    const Client = this.clientFlagRepository.model.sequelize.models.Client;
    
    await Client.update(
      { overall_status: newOverallStatus },
      { where: { id: clientId }, transaction }
    );
  }
}

module.exports = CreateSaleUseCase;