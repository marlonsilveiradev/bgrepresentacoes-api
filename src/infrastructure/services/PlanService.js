const { Op } = require('sequelize');
const { Plan, Flag, PlanFlag } = require('../repositories/models');
const AppError = require('../../shared/utils/AppError');
const logger = require('../../infrastructure/config/logger');

/**
 * Valida que todos os flag_ids informados existem e estão ativos.
 * Retorna os objetos Flag para reuso.
 * @param {string[]} flagIds
 * @returns {Flag[]}
 */
const _validateFlags = async (flagIds) => {
  if (!flagIds || flagIds.length === 0) return [];

  const flags = await Flag.findAll({
    where: { id: { [Op.in]: flagIds }, is_active: true },
    attributes: ['id', 'name'],
  });

  if (flags.length !== flagIds.length) {
    // Descobre quais IDs não foram encontrados para mensagem precisa
    const foundIds = flags.map((f) => f.id);
    const missing  = flagIds.filter((id) => !foundIds.includes(id));
    throw new AppError(
      `Bandeira(s) não encontrada(s) ou inativa(s): ${missing.join(', ')}`,
      422
    );
  }

  return flags;
};

// ─── Listar ───────────────────────────────────────────────────────────────────
/**
 * Lista planos com paginação, filtros e bandeiras associadas.
 * Suporta filtro por flag_id (retorna planos que contêm aquela bandeira).
 */
const listPlans = async ({ page = 1, limit = 20, is_active, flag_id, search } = {}) => {
  const offset = (page - 1) * limit;
  const where  = {};

  if (is_active !== undefined) where.is_active = is_active;

  if (search) {
    where[Op.or] = [
      { name:        { [Op.iLike]: `%${search}%` } },
      { description: { [Op.iLike]: `%${search}%` } },
    ];
  }

  // Filtro por bandeira via include + required
  const includeFlags = {
    model:      Flag,
    as:         'flags',
    attributes: ['id', 'name', 'price'],
    through:    { attributes: [] }, // oculta campos da tabela pivot
    required:   false,              // LEFT JOIN por padrão
  };

  if (flag_id) {
    includeFlags.where    = { id: flag_id };
    includeFlags.required = true; // vira INNER JOIN — filtra planos com essa bandeira
  }

  const { rows, count } = await Plan.findAndCountAll({
    where,
    include:  [includeFlags],
    order:    [['name', 'ASC']],
    limit,
    offset,
    distinct: true, // evita count inflado pelo JOIN
  });

  return {
    rows,
    count,
    totalPages:  Math.ceil(count / limit),
    currentPage: page,
  };
};

// ─── Buscar por ID ────────────────────────────────────────────────────────────
const getPlanById = async (id) => {
  const plan = await Plan.findByPk(id, {
    include: [{
      model:      Flag,
      as:         'flags',
      attributes: ['id', 'name', 'description', 'price', 'is_active'],
      through:    { attributes: [] },
    }],
  });

  if (!plan) throw new AppError('Plano não encontrado.', 404);
  return plan;
};

// ─── Criar ────────────────────────────────────────────────────────────────────
/**
 * Cria um plano e vincula as bandeiras informadas.
 * @param {{ name, description, price, flag_ids }} data
 */
const createPlan = async ({ name, description, price, flag_ids = [] }) => {
  // 1. Valida bandeiras antes de qualquer escrita
  await _validateFlags(flag_ids);

  // 2. Cria o plano
  const plan = await Plan.create({
    name:        name.trim(),
    description: description || null,
    price,
    is_active:   true,
  });

  // 3. Vincula as bandeiras na tabela pivot plan_flags
  if (flag_ids.length > 0) {
    await PlanFlag.bulkCreate(
      flag_ids.map((flag_id) => ({ plan_id: plan.id, flag_id })),
      { ignoreDuplicates: true }
    );
  }

  logger.info({ planId: plan.id, flags: flag_ids }, 'Plano criado.');

  // Retorna com bandeiras populadas
  return getPlanById(plan.id);
};

// ─── Atualizar ────────────────────────────────────────────────────────────────
/**
 * Atualiza um plano.
 * Se `flag_ids` for enviado, SUBSTITUI completamente as bandeiras do plano.
 * Se `flag_ids` não for enviado, as bandeiras atuais são preservadas.
 *
 * @param {string} id
 * @param {{ name?, description?, price?, is_active?, flag_ids? }} data
 */
const updatePlan = async (id, data) => {
  const plan = await Plan.findByPk(id);
  if (!plan) throw new AppError('Plano não encontrado.', 404);

  const { flag_ids, ...planData } = data;

  // Atualiza campos escalares (apenas os enviados)
  if (Object.keys(planData).length > 0) {
    if (planData.name) planData.name = planData.name.trim();
    await plan.update(planData);
  }

  // Sincroniza bandeiras apenas se flag_ids foi explicitamente enviado
  if (flag_ids !== undefined) {
    await _validateFlags(flag_ids);

    // Remove todas as associações atuais e recria
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

  return getPlanById(id);
};

// ─── Desativar ────────────────────────────────────────────────────────────────
const deactivatePlan = async (id) => {
  const plan = await Plan.findByPk(id);
  if (!plan) throw new AppError('Plano não encontrado.', 404);
  if (!plan.is_active) throw new AppError('Plano já está desativado.', 409);

  await plan.update({ is_active: false });
  logger.info({ planId: id }, 'Plano desativado.');
  return { message: `Plano "${plan.name}" desativado com sucesso.` };
};

// ─── Reativar ─────────────────────────────────────────────────────────────────
const reactivatePlan = async (id) => {
  const plan = await Plan.findByPk(id);
  if (!plan) throw new AppError('Plano não encontrado.', 404);
  if (plan.is_active) throw new AppError('Plano já está ativo.', 409);

  await plan.update({ is_active: true });
  logger.info({ planId: id }, 'Plano reativado.');
  return { message: `Plano "${plan.name}" reativado com sucesso.` };
};

module.exports = {
  listPlans,
  getPlanById,
  createPlan,
  updatePlan,
  deactivatePlan,
  reactivatePlan,
};
