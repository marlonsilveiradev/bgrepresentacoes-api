/**
 * ClientRepository
 * ✅ CORRIGIDO: Agora recebe o model via Injeção de Dependência
 */
class ClientRepository {
  // O segredo está aqui: o construtor recebe o db.Client do index
  constructor(model) {
    this.model = model;
  }

  async create(data, options) {
    // Agora ele usa o model que JÁ ESTÁ CONECTADO e pronto
    // O 'options' aqui já traz a sua transação do Use Case
    return await this.model.create(data, options);
  }

  async findByCnpj(cnpj) {
    return await this.model.findOne({ where: { cnpj } });
  }

  async findById(id) {
    return await this.model.findByPk(id);
  }

  async findByProtocol(protocol) {
  return await this.model.findOne({ where: { protocol } });
}

async findAll(options = {}) {
  const { where = {}, limit = 20, offset = 0, order = [['created_at', 'DESC']] } = options;

  return await this.model.findAndCountAll({
    where,
    limit,
    offset,
    order,
    raw: false,
  });
}
}

module.exports = ClientRepository;