const { ClientBankAccount } = require('./models');

class ClientBankAccountRepository {
  constructor() {
    // É essencial expor o model para que o UseCase e o Sequelize 
    // se entendam durante a transação
    this.model = ClientBankAccount;
  }

  async create(data, options = {}) {
    // Usamos o this.model que agora está mapeado
    return await this.model.create(data, { transaction: options.transaction || null, returning: true });
  }
}

module.exports = ClientBankAccountRepository;