const AppError = require('../../../shared/utils/AppError');
const logger = require('../../../infrastructure/config/logger');
const { ROLES } = require('../../../shared/constants/roles');

class UpdateSaleStatusUseCase {
  constructor(saleRepository, clientFlagRepository, sequelize) {
    this.saleRepository = saleRepository;
    this.clientFlagRepository = clientFlagRepository;
    this.sequelize = sequelize;
  }

  async execute(saleId, requester, { status, notes }) {
    const transactionId = `upd-sale-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    try {
      logger.info(
        { transactionId, saleId, newStatus: status },
        '[UpdateSaleStatusUseCase] Atualizando status da venda'
      );

      // ✅ Validar status
      this._validateStatus(status);

      // ✅ Buscar venda
      const sale = await this.saleRepository.findById(saleId);

      if (!sale) {
        throw new AppError('Venda não encontrada.', 404, 'SALE_NOT_FOUND');
      }

      // ✅ Apenas admin pode atualizar status
      if (requester.role !== ROLES.ADMIN) {
        throw new AppError('Apenas administradores podem atualizar o status de vendas.', 403);
      }

      // ✅ Transação
      const transaction = await this.sequelize.transaction();

      try {
        const updateData = { status, notes };

        if (status === 'approved') {
          updateData.approved_at = new Date();
        }

        await this.saleRepository.update(saleId, updateData, { transaction });

        // ✅ Sincronizar status do cliente
        await this._syncClientOverallStatus(sale.client_id, transaction);

        await transaction.commit();

        logger.info(
          { transactionId, saleId, newStatus: status },
          '[UpdateSaleStatusUseCase] Status atualizado com sucesso'
        );

        return sale;

      } catch (error) {
        await transaction.rollback();
        throw error;
      }

    } catch (error) {
      if (error instanceof AppError) throw error;

      logger.error(
        { transactionId, saleId, error: error.message },
        '[UpdateSaleStatusUseCase] Erro ao atualizar status'
      );

      throw new AppError('Erro ao atualizar status da venda', 500, 'SALE_UPDATE_ERROR');
    }
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

  _validateStatus(status) {
    const validStatuses = ['pending', 'analysis', 'approved', 'cancelled'];

    if (!validStatuses.includes(status)) {
      throw new AppError(
        `Status inválido. Use: ${validStatuses.join(', ')}`,
        400,
        'INVALID_STATUS'
      );
    }
  }
}

module.exports = UpdateSaleStatusUseCase;