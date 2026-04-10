const AppError = require('../../../shared/utils/AppError');
const logger = require('../../../infrastructure/config/logger');
const { ROLES } = require('../../../shared/constants/roles');

class CancelSaleUseCase {
  constructor(saleRepository, clientFlagRepository, sequelize) {
    this.saleRepository = saleRepository;
    this.clientFlagRepository = clientFlagRepository;
    this.sequelize = sequelize;
  }

  async execute(saleId, requester, { notes }) {
    const transactionId = `cancel-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    try {
      logger.info(
        { transactionId, saleId, userId: requester.id },
        '[CancelSaleUseCase] Cancelando venda'
      );

      // ✅ Buscar venda
      const sale = await this.saleRepository.findById(saleId);

      if (!sale) {
        throw new AppError('Venda não encontrada.', 404, 'SALE_NOT_FOUND');
      }

      // ✅ Validar permissão
      this._assertCanCancel(sale, requester);

      // ✅ Validar status
      if (sale.status === 'approved') {
        throw new AppError('Venda aprovada não pode ser cancelada.', 409, 'SALE_ALREADY_APPROVED');
      }

      if (sale.status === 'cancelled') {
        throw new AppError('Venda já está cancelada.', 409, 'SALE_ALREADY_CANCELLED');
      }

      // ✅ Transação
      const transaction = await this.sequelize.transaction();

      try {
        await this.saleRepository.update(
          saleId,
          { status: 'cancelled', notes: notes || sale.notes },
          { transaction }
        );

        // ✅ Sincronizar status do cliente
        await this._syncClientOverallStatus(sale.client_id, transaction);

        await transaction.commit();

        logger.info(
          { transactionId, saleId, cancelledBy: requester.id },
          '[CancelSaleUseCase] Venda cancelada com sucesso'
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
        '[CancelSaleUseCase] Erro ao cancelar venda'
      );

      throw new AppError('Erro ao cancelar venda', 500, 'SALE_CANCEL_ERROR');
    }
  }

  _assertCanCancel(sale, requester) {
    const isAdmin = requester.role === ROLES.ADMIN;
    const isSeller = sale.sold_by === requester.id;

    if (!isAdmin && !isSeller) {
      throw new AppError('Você só pode cancelar suas próprias vendas.', 403);
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
}

module.exports = CancelSaleUseCase;