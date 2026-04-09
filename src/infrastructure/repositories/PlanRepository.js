const { Plan } = require('./models');

class PlanRepository {
  async findById(id) {
    return await Plan.findByPk(id);
  }

  async findAllActive() {
    return await Plan.findAll({ where: { active: true } });
  }
}

module.exports = PlanRepository;