const { Op } = require('sequelize');

/**
 * Repositório de Planos — isolamento de persistência (Sequelize).
 */
class PlanRepository {
  constructor(model) {
    this.model = model;
  }

  _flagIncludeForList({ flagId }) {
    const Flag = this.model.sequelize.models.Flag;
    const include = {
      model: Flag,
      as: 'flags',
      attributes: ['id', 'name', 'price'],
      through: { attributes: [] },
      required: false,
    };
    if (flagId) {
      include.where = { id: flagId };
      include.required = true;
    }
    return include;
  }

  /**
   * Listagem paginada (mesma semântica do antigo PlanService.listPlans).
   */
  async findAndCountForList({ page, limit, is_active, flag_id, search }) {
    const offset = (page - 1) * limit;
    const where = {};

    if (is_active !== undefined) {
      where.is_active = is_active;
    }

    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
      ];
    }

    return this.model.findAndCountAll({
      where,
      include: [this._flagIncludeForList({ flagId: flag_id })],
      order: [['name', 'ASC']],
      limit,
      offset,
      distinct: true,
    });
  }

  /**
   * Detalhe com bandeiras (cache / API admin).
   */
  async findByIdWithDetail(id) {
    const Flag = this.model.sequelize.models.Flag;
    return this.model.findByPk(id, {
      include: [
        {
          model: Flag,
          as: 'flags',
          attributes: ['id', 'name', 'description', 'price', 'is_active'],
          through: { attributes: [] },
        },
      ],
    });
  }

  async findById(id) {
    return this.model.findByPk(id);
  }

  /**
   * Plano com bandeiras (onboarding / vendas) — sem filtro de atributos nas flags.
   */
  async findByIdWithFlags(planId) {
    const Flag = this.model.sequelize.models.Flag;
    return this.model.findByPk(planId, {
      include: [{ model: Flag, as: 'flags', through: { attributes: [] } }],
    });
  }

  async create({ name, description, price, is_active = true }) {
    return this.model.create({
      name: name.trim(),
      description: description ?? null,
      price,
      is_active,
    });
  }

  async saveInstance(instance, values, options = {}) {
    return instance.update(values, options);
  }

  async destroyPlanFlagsByPlanId(planId, options = {}) {
    const PlanFlag = this.model.sequelize.models.PlanFlag;
    return PlanFlag.destroy({ where: { plan_id: planId }, ...options });
  }

  async bulkCreatePlanFlags(rows, options = {}) {
    const PlanFlag = this.model.sequelize.models.PlanFlag;
    return PlanFlag.bulkCreate(rows, { ignoreDuplicates: true, ...options });
  }
}

module.exports = PlanRepository;
