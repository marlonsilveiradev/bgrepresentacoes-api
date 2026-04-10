const { Plan } = require('./models');

class PlanRepository {
  async findById(id) {
    return await Plan.findByPk(id);
  }

  async findAllActive() {
    return await Plan.findAll({ where: { active: true } });
  }

  async findByIdWithFlags(planId) {
  return await this.model.findByPk(planId, {
    include: [
      { model: this.model.sequelize.models.Flag, as: 'flags', through: { attributes: [] } },
    ],
  });
}
}

module.exports = PlanRepository;