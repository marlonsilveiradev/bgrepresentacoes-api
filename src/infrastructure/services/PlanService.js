const { Op } = require('sequelize');
const { Plan, Flag, PlanFlag } = require('../repositories/models');
const CacheService = require('./CacheService');
const AppError = require('../../shared/utils/AppError');
const logger = require('../../infrastructure/config/logger');

class PlanService {
  async listPlans({ page = 1, limit = 20, is_active, flag_id, search } = {}) {
    const cacheKey = `plans:list:${page}:${limit}:${is_active}:${flag_id || 'none'}:${search || 'none'}`;
    const cached = await CacheService.get(cacheKey);
    if (cached) return cached;

    const offset = (page - 1) * limit;
    const where = {};
    if (is_active !== undefined) where.is_active = is_active;
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const includeFlags = {
      model: Flag,
      as: 'flags',
      attributes: ['id', 'name', 'price'],
      through: { attributes: [] },
      required: false,
    };
    if (flag_id) {
      includeFlags.where = { id: flag_id };
      includeFlags.required = true;
    }

    const { rows, count } = await Plan.findAndCountAll({
      where,
      include: [includeFlags],
      order: [['name', 'ASC']],
      limit,
      offset,
      distinct: true,
    });

    const result = {
      rows,
      count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
    };

    await CacheService.set(cacheKey, result);
    return result;
  }

  async getPlanById(id) {
    const cacheKey = `plans:${id}`;
    const cached = await CacheService.get(cacheKey);
    if (cached) return cached;

    const plan = await Plan.findByPk(id, {
      include: [{
        model: Flag,
        as: 'flags',
        attributes: ['id', 'name', 'description', 'price', 'is_active'],
        through: { attributes: [] },
      }],
    });
    if (!plan) throw new AppError('Plano não encontrado.', 404);

    await CacheService.set(cacheKey, plan);
    return plan;
  }

  async createPlan({ name, description, price, flag_ids = [] }) {
    await this._validateFlags(flag_ids);
    const plan = await Plan.create({
      name: name.trim(),
      description: description || null,
      price,
      is_active: true,
    });
    if (flag_ids.length > 0) {
      await PlanFlag.bulkCreate(
        flag_ids.map((flag_id) => ({ plan_id: plan.id, flag_id })),
        { ignoreDuplicates: true }
      );
    }
    logger.info({ planId: plan.id, flags: flag_ids }, 'Plano criado.');
    await this._invalidateCache();
    return this.getPlanById(plan.id);
  }

  async updatePlan(id, data) {
    const plan = await Plan.findByPk(id);
    if (!plan) throw new AppError('Plano não encontrado.', 404);

    const { flag_ids, ...planData } = data;
    if (Object.keys(planData).length > 0) {
      if (planData.name) planData.name = planData.name.trim();
      await plan.update(planData);
    }

    if (flag_ids !== undefined) {
      await this._validateFlags(flag_ids);
      await PlanFlag.destroy({ where: { plan_id: id } });
      if (flag_ids.length > 0) {
        await PlanFlag.bulkCreate(
          flag_ids.map((flag_id) => ({ plan_id: id, flag_id })),
          { ignoreDuplicates: true }
        );
      }
      logger.info({ planId: id, newFlags: flag_ids }, 'Bandeiras do plano sincronizadas.');
    }

    logger.info({ planId: id, changes: Object.keys(data) }, 'Plano atualizado.');
    await this._invalidateCache();
    return this.getPlanById(id);
  }

  async deactivatePlan(id) {
    const plan = await Plan.findByPk(id);
    if (!plan) throw new AppError('Plano não encontrado.', 404);
    if (!plan.is_active) throw new AppError('Plano já está desativado.', 409);
    await plan.update({ is_active: false });
    logger.info({ planId: id }, 'Plano desativado.');
    await this._invalidateCache();
    return { message: `Plano "${plan.name}" desativado com sucesso.` };
  }

  async reactivatePlan(id) {
    const plan = await Plan.findByPk(id);
    if (!plan) throw new AppError('Plano não encontrado.', 404);
    if (plan.is_active) throw new AppError('Plano já está ativo.', 409);
    await plan.update({ is_active: true });
    logger.info({ planId: id }, 'Plano reativado.');
    await this._invalidateCache();
    return { message: `Plano "${plan.name}" reativado com sucesso.` };
  }

  // ========== Métodos privados ==========

  async _validateFlags(flagIds) {
    if (!flagIds || flagIds.length === 0) return [];
    const flags = await Flag.findAll({
      where: { id: { [Op.in]: flagIds }, is_active: true },
      attributes: ['id', 'name'],
    });
    if (flags.length !== flagIds.length) {
      const foundIds = flags.map(f => f.id);
      const missing = flagIds.filter(id => !foundIds.includes(id));
      throw new AppError(
        `Bandeira(s) não encontrada(s) ou inativa(s): ${missing.join(', ')}`,
        422
      );
    }
    return flags;
  }

  async _invalidateCache() {
    await CacheService.delPattern('plans:*');
  }
}

module.exports = new PlanService();