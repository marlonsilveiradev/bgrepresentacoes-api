const { SaleFlag } = require('./models');

class SaleFlagRepository {
  constructor() {
    this.model = SaleFlag;
  }

  async bulkCreate(data, options = {}) {
    return await this.model.bulkCreate(data, {
      transaction: options.transaction || null,
    });
  }
}

module.exports = SaleFlagRepository;