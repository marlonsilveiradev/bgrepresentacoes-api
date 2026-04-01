const { Client, ClientFlag, Flag } = require('../repositories/models');
const AppError = require('../../shared/utils/AppError');
const logger = require('../../infrastructure/config/logger');

/**
 * Atualiza o status de uma bandeira específica e sincroniza o status do Cliente.
 */
const updateFlagStatus = async (flagId, requester, { status, notes }) => {
  // 1. Busca a bandeira com os dados do cliente para validar permissão
  const clientFlag = await ClientFlag.findByPk(flagId, {
    include: [{ model: Client, as: 'client' }]
  });

  if (!clientFlag) throw new AppError('Vínculo de bandeira não encontrado.', 404);

  // 2. Validação de Permissão (Admin ou Dono do Registro)
  // Nota: Geralmente, apenas Admin ou um perfil "Backoffice" aprova. 
  // Se o 'user' puder aprovar a própria bandeira, a segurança é essa mesma:
  const isAdmin = requester.role === 'admin';
  const isOwner = clientFlag.client.created_by === requester.id;

  if (!isAdmin && !isOwner) {
    throw new AppError('Você não tem permissão para alterar o status desta bandeira.', 403);
  }

  const t = await ClientFlag.sequelize.transaction();

  try {
    const updateData = { status, notes };
    
    // Ajustado para bater com os ENUMS do seu Model (analysis e approved)
    if (status === 'approved') {
      updateData.approved_at = new Date();
      updateData.analyzed_by = requester.id;
    }
    
    if (status === 'analysis') {
      updateData.analyzed_at = new Date();
      updateData.analyzed_by = requester.id;
    }

    await clientFlag.update(updateData, { transaction: t });

    // 4. Lógica de Sincronização do Status Geral
    await _syncClientOverallStatus(clientFlag.client_id, t);

    await t.commit();
    
    // Retorna o objeto atualizado
    return clientFlag;
  } catch (error) {
    await t.rollback();
    logger.error(`Erro ao atualizar status da bandeira ${flagId}: ${error.message}`);
    throw error;
  }
};

/**
 * Função privada para calcular o status geral do cliente com base nas suas bandeiras.
 * Segue os Enums do modelo Client: ['pending', 'analysis', 'approved']
 */
const _syncClientOverallStatus = async (clientId, transaction) => {
  // Contamos as bandeiras por status de forma atômica no banco
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

  const stats = {
    pending: 0,
    analysis: 0,
    approved: 0,
    total: 0
  };

  counts.forEach(c => {
    stats[c.status] = Number.parseInt(c.total, 10);
    stats.total += Number.parseInt(c.total, 10);
  });

  let newOverallStatus = 'pending';

  // Regra de Negócio para Overall Status:
  if (stats.approved === stats.total) {
    newOverallStatus = 'approved'; // Todas aprovadas
  } else if (stats.analysis > 0 || stats.approved > 0) {
    newOverallStatus = 'analysis'; // Se houver qualquer uma em análise ou algumas aprovadas
  }

  await Client.update(
    { overall_status: newOverallStatus },
    { where: { id: clientId }, transaction }
  );
};

module.exports = { updateFlagStatus };