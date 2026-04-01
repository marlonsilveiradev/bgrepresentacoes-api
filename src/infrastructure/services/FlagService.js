const { Op } = require('sequelize');
const { Flag } = require('../repositories/models');
const AppError = require('../../shared/utils/AppError');
const logger = require('../../infrastructure/config/logger');

// ─── Listar ───────────────────────────────────────────────────────────────────
const listFlags = async ({ page = 1, limit = 20, is_active, search } = {}) => {
  const offset = (page - 1) * limit;
  const where  = {};

  if (is_active !== undefined) where.is_active = is_active;

  if (search) {
    where[Op.or] = [
      { name:        { [Op.iLike]: `%${search}%` } },
      { description: { [Op.iLike]: `%${search}%` } },
    ];
  }

  const { rows, count } = await Flag.findAndCountAll({
    where,
    attributes: ['id', 'name', 'description', 'price', 'is_active', 'created_at'],
    order:  [['name', 'ASC']],
    limit,
    offset,
  });

  return {
    rows,
    count,
    totalPages:  Math.ceil(count / limit),
    currentPage: page,
  };
};

// ─── Buscar por ID ────────────────────────────────────────────────────────────
const getFlagById = async (id) => {
  const flag = await Flag.findByPk(id, {
    attributes: ['id', 'name', 'description', 'price', 'is_active', 'created_at', 'updated_at'],
  });

  if (!flag) throw new AppError('Bandeira não encontrada.', 404);
  return flag;
};

// ─── Criar ────────────────────────────────────────────────────────────────────
const createFlag = async ({ name, description, price }) => {
  const existing = await Flag.findOne({ where: { name: name.trim() } });
  if (existing) throw new AppError('Já existe uma bandeira com esse nome.', 409);

  const flag = await Flag.create({ name: name.trim(), description, price });

  logger.info({ flagId: flag.id }, 'Bandeira criada.');
  return flag;
};

// ─── Atualizar ────────────────────────────────────────────────────────────────
const updateFlag = async (id, data) => {
  const flag = await Flag.findByPk(id);
  if (!flag) throw new AppError('Bandeira não encontrada.', 404);

  // Verifica duplicidade de nome se estiver sendo alterado
  if (data.name && data.name.trim() !== flag.name) {
    const existing = await Flag.findOne({ where: { name: data.name.trim() } });
    if (existing) throw new AppError('Já existe uma bandeira com esse nome.', 409);
    data.name = data.name.trim();
  }

  await flag.update(data);
  logger.info({ flagId: id, changes: Object.keys(data) }, 'Bandeira atualizada.');
  return flag;
};

// ─── Desativar ────────────────────────────────────────────────────────────────
const deactivateFlag = async (id) => {
  const flag = await Flag.findByPk(id);
  if (!flag) throw new AppError('Bandeira não encontrada.', 404);
  if (!flag.is_active) throw new AppError('Bandeira já está desativada.', 409);

  await flag.update({ is_active: false });
  logger.info({ flagId: id }, 'Bandeira desativada.');
  return { message: `Bandeira "${flag.name}" desativada com sucesso.` };
};

// ─── Reativar ─────────────────────────────────────────────────────────────────
const reactivateFlag = async (id) => {
  const flag = await Flag.findByPk(id);
  if (!flag) throw new AppError('Bandeira não encontrada.', 404);
  if (flag.is_active) throw new AppError('Bandeira já está ativa.', 409);

  await flag.update({ is_active: true });
  logger.info({ flagId: id }, 'Bandeira reativada.');
  return { message: `Bandeira "${flag.name}" reativada com sucesso.` };
};

module.exports = { listFlags, getFlagById, createFlag, updateFlag, deactivateFlag, reactivateFlag };
