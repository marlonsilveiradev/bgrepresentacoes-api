/**
 * ClientRepository
 * ✅ CORRIGIDO: Agora recebe o model via Injeção de Dependência
 */
class ClientRepository {
  // O segredo está aqui: o construtor recebe o db.Client do index
  constructor(model) {
    this.model = model;
  }

  /**
   * Includes para visão PARTNER: bandeiras (nome + status) e última venda (só plan_name).
   * `separate: true` evita inflar linhas no COUNT da listagem.
   */
  partnerViewIncludes() {
    const db = this.model.sequelize.models;

    return [
      {
        model: db.ClientFlag,
        as: 'flags',
        attributes: ['status'],
        required: false,
        separate: true,
        include: [
          {
            model: db.Flag,
            as: 'flag',
            attributes: ['name'],
          },
        ],
      },
      {
        model: db.Sale,
        as: 'sales',
        attributes: ['plan_name', 'created_at'],
        required: false,
        separate: true,
        limit: 1,
        order: [['created_at', 'DESC']],
      },
    ];
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

  /** Detalhe do cliente com relações mínimas para montar o DTO do PARTNER. */
  async findByIdWithPartnerView(id) {
    return await this.model.findByPk(id, {
      include: this.partnerViewIncludes(),
    });
  }

  async findByProtocol(protocol) {
  return await this.model.findOne({ where: { protocol } });
}

async findAll(options = {}) {
  const { where = {}, limit = 20, offset = 0, order = [['created_at', 'DESC']], include } = options;

  const query = {
    where,
    limit,
    offset,
    order,
    raw: false,
  };

  if (include && include.length > 0) {
    query.include = include;
    query.distinct = true;
    query.col = this.model.primaryKeyAttribute || 'id';
  }

  return await this.model.findAndCountAll(query);
}
}

module.exports = ClientRepository;