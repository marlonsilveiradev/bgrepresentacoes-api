const { ClientFlag } = require('./models');

class ClientFlagRepository {
  async bulkCreate(flags, transaction) {
    return await ClientFlag.bulkCreate(flags, { transaction });
  }

  async findByIdWithClient(flagId) {
  return await this.model.findByPk(flagId, {
    include: [{ model: this.model.sequelize.models.Client, as: 'client' }],
  });
}

async update(id, data, options = {}) {
  const flag = await this.model.findByPk(id, {
    transaction: options.transaction || null,
  });

  if (!flag) {
    throw new AppError('Bandeira não encontrada', 404, 'FLAG_NOT_FOUND');
  }

  return await flag.update(data, { transaction: options.transaction || null });
}
}

module.exports = ClientFlagRepository;