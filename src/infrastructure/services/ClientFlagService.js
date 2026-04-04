const { Client, ClientFlag, Flag } = require('../repositories/models');
const AppError = require('../../shared/utils/AppError');
const logger = require('../../infrastructure/config/logger');

class ClientFlagService {
  /**
   * Atualiza o status de uma bandeira de cliente e sincroniza o status geral do cliente.
   */
  async updateFlagStatus(flagId, requester, { status, notes }) {
    // 1. Busca a bandeira com os dados do cliente
    const clientFlag = await ClientFlag.findByPk(flagId, {
      include: [{ model: Client, as: 'client' }]
    });
    if (!clientFlag) throw new AppError('Vínculo de bandeira não encontrado.', 404);

    // 2. Permissão: admin ou dono do cliente
    const isAdmin = requester.role === 'admin';
    const isOwner = clientFlag.client.created_by === requester.id;
    if (!isAdmin && !isOwner) {
      throw new AppError('Você não tem permissão para alterar o status desta bandeira.', 403);
    }

    const t = await ClientFlag.sequelize.transaction();
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

      await clientFlag.update(updateData, { transaction: t });
      await this._syncClientOverallStatus(clientFlag.client_id, t);
      await t.commit();
      return clientFlag;
    } catch (error) {
      await t.rollback();
      logger.error(`Erro ao atualizar status da bandeira ${flagId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Recalcula e atualiza o status geral do cliente com base nas suas bandeiras.
   * @private
   */
  async _syncClientOverallStatus(clientId, transaction) {
    const counts = await ClientFlag.findAll({
      where: { client_id: clientId },
      attributes: [
        'status',
        [ClientFlag.sequelize.fn('COUNT', ClientFlag.sequelize.col('id')), 'total']
      ],
      group: ['status'],
      raw: true,
      transaction
    });

    const stats = { pending: 0, analysis: 0, approved: 0, total: 0 };
    counts.forEach(c => {
      stats[c.status] = Number.parseInt(c.total, 10);
      stats.total += Number.parseInt(c.total, 10);
    });

    let newOverallStatus = 'pending';
    if (stats.approved === stats.total) {
      newOverallStatus = 'approved';
    } else if (stats.analysis > 0 || stats.approved > 0) {
      newOverallStatus = 'analysis';
    }

    await Client.update(
      { overall_status: newOverallStatus },
      { where: { id: clientId }, transaction }
    );
  }
}

module.exports = new ClientFlagService();