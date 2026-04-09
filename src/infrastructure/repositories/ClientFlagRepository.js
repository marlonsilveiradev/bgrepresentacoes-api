const { ClientFlag } = require('./models');

class ClientFlagRepository {
  async bulkCreate(flags, transaction) {
    return await ClientFlag.bulkCreate(flags, { transaction });
  }
}

module.exports = ClientFlagRepository;