const AppError = require('../../../shared/utils/AppError');
const logger = require('../../../infrastructure/config/logger');
const { ROLES } = require('../../../shared/constants/roles');

class UpdateClientFlagStatusUseCase {
  constructor(clientFlagRepository, sequelize) {
    this.clientFlagRepository = clientFlagRepository;
    this.sequelize = sequelize;
  }

  async execute(flagId, requester, { status, notes }) {
    const transactionId = `flag-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    try {
      logger.info(
        { transactionId, flagId, status },
        '[UpdateClientFlagStatusUseCase] Atualizando status da bandeira'
      );

      // ✅ Buscar bandeira com cliente
      const clientFlag = await this.clientFlagRepository.findByIdWithClient(flagId);

      if (!clientFlag) {
        throw new AppError('Vínculo de bandeira não encontrado.', 404, 'CLIENT_FLAG_NOT_FOUND');
      }

      // ✅ Validar permissão
      this._assertCanWrite(clientFlag, requester);

      // ✅ Validar status
      this._validateStatus(status);

      // ✅ Transação
      const transaction = await this.sequelize.transaction();

      try {
        const updateData = { status, notes };

        if (status === 'approved') {
          updateData.approved_at = new Date();
          updateData.analyzed_by = requester.id;
        }

        if (status === 'analysis') {
          updateData.analyzed_at = new Date();
          updateData.analyzed_by = requester.id;
        }

        await this.clientFlagRepository.update(flagId, updateData, { transaction });

        // ✅ Sincronizar status geral do cliente
        await this._syncClientOverallStatus(clientFlag.client_id, transaction);

        await transaction.commit();

        logger.info(
          { transactionId, flagId },
          '[UpdateClientFlagStatusUseCase] Status atualizado com sucesso'
        );

        return clientFlag;

      } catch (error) {
        await transaction.rollback();
        throw error;
      }

    } catch (error) {
      if (error instanceof AppError) throw error;

      logger.error(
        { transactionId, flagId, error: error.message },
        '[UpdateClientFlagStatusUseCase] Erro'
      );

      throw new AppError('Erro ao atualizar bandeira', 500, 'FLAG_UPDATE_ERROR');
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

  _assertCanWrite(clientFlag, requester) {
    const isAdmin = requester.role === ROLES.ADMIN;
    const isOwner = clientFlag.client.created_by === requester.id;

    if (!isAdmin && !isOwner) {
      throw new AppError('Você não tem permissão para alterar esta bandeira.', 403);
    }
  }

  _validateStatus(status) {
    const validStatuses = ['pending', 'analysis', 'approved'];
    
    if (!validStatuses.includes(status)) {
      throw new AppError(
        `Status inválido. Use: ${validStatuses.join(', ')}`,
        400,
        'INVALID_STATUS'
      );
    }
  }
}

module.exports = UpdateClientFlagStatusUseCase;