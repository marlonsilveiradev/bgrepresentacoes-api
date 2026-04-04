const { Op } = require('sequelize');
const { Flag } = require('../repositories/models');
const CacheService = require('./CacheService');
const AppError = require('../../shared/utils/AppError');
const logger = require('../../infrastructure/config/logger');

class FlagService {
  async listFlags({ page = 1, limit = 20, is_active, search } = {}) {
    // Cache key única para esta combinação de filtros
    const cacheKey = `flags:list:${page}:${limit}:${is_active}:${search || 'none'}`;
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

    const { rows, count } = await Flag.findAndCountAll({
      where,
      attributes: ['id', 'name', 'description', 'price', 'is_active', 'created_at'],
      order: [['name', 'ASC']],
      limit,
      offset,
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

  async getFlagById(id) {
    const cacheKey = `flags:${id}`;
    const cached = await CacheService.get(cacheKey);
    if (cached) return cached;

    const flag = await Flag.findByPk(id, {
      attributes: ['id', 'name', 'description', 'price', 'is_active', 'created_at', 'updated_at'],
    });
    if (!flag) throw new AppError('Bandeira não encontrada.', 404);

    await CacheService.set(cacheKey, flag);
    return flag;
  }

  async createFlag({ name, description, price }) {
    const existing = await Flag.findOne({ where: { name: name.trim() } });
    if (existing) throw new AppError('Já existe uma bandeira com esse nome.', 409);
    const flag = await Flag.create({ name: name.trim(), description, price });
    logger.info({ flagId: flag.id }, 'Bandeira criada.');
    await this._invalidateCache();
    return flag;
  }

  async updateFlag(id, data) {
    const flag = await Flag.findByPk(id);
    if (!flag) throw new AppError('Bandeira não encontrada.', 404);
    if (data.name && data.name.trim() !== flag.name) {
      const existing = await Flag.findOne({ where: { name: data.name.trim() } });
      if (existing) throw new AppError('Já existe uma bandeira com esse nome.', 409);
      data.name = data.name.trim();
    }
    await flag.update(data);
    logger.info({ flagId: id, changes: Object.keys(data) }, 'Bandeira atualizada.');
    await this._invalidateCache();
    return flag;
  }

  async deactivateFlag(id) {
    const flag = await Flag.findByPk(id);
    if (!flag) throw new AppError('Bandeira não encontrada.', 404);
    if (!flag.is_active) throw new AppError('Bandeira já está desativada.', 409);
    await flag.update({ is_active: false });
    logger.info({ flagId: id }, 'Bandeira desativada.');
    await this._invalidateCache();
    return { message: `Bandeira "${flag.name}" desativada com sucesso.` };
  }

  async reactivateFlag(id) {
    const flag = await Flag.findByPk(id);
    if (!flag) throw new AppError('Bandeira não encontrada.', 404);
    if (flag.is_active) throw new AppError('Bandeira já está ativa.', 409);
    await flag.update({ is_active: true });
    logger.info({ flagId: id }, 'Bandeira reativada.');
    await this._invalidateCache();
    return { message: `Bandeira "${flag.name}" reativada com sucesso.` };
  }

  // ========== Métodos privados ==========
  async _invalidateCache() {
    // Remove todas as chaves que começam com "flags:list:" e "flags:"
    await CacheService.delPattern('flags:*');
  }
}

module.exports = new FlagService();