const { Op } = require('sequelize');
const { User } = require('../models');
const AppError = require('../utils/AppError');
const logger = require('../config/logger');

/**
 * Regras de negócio para gestão de usuários.
 *
 * NOTA sobre "must_change_password":
 * O projeto não possui esse campo no banco. O mesmo efeito é alcançado com
 * last_login_at = null. No primeiro login, o AuthService detecta o null e
 * retorna mustChangePassword: true, forçando a troca antes de prosseguir.
 */

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Gera uma senha temporária aleatória que atende à política de senha forte.
 * Formato: Tmp-XXXXX-YYYY (maiúscula + número + especial garantidos)
 * Ex: Tmp-A7k2m-2026
 */
const _generateTempPassword = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  const nums = '0123456789';
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const specials = '!@#$%';

  const randomStr = (src, len) =>
    Array.from({ length: len }, () => src[Math.floor(Math.random() * src.length)]).join('');

  // Garante pelo menos 1 de cada categoria exigida pela política
  const part1 = randomStr(upper, 1);
  const part2 = randomStr(chars, 4);
  const part3 = randomStr(nums, 4);
  const part4 = randomStr(specials, 1);

  return `${part1}${part2}-${part3}${part4}`;
};

// ─── Listar usuários (admin) ──────────────────────────────────────────────────
const listUsers = async ({ page = 1, limit = 20, role, is_active, search } = {}) => {
  const offset = (page - 1) * limit;
  const where = {};

  if (role !== undefined) where.role = role;
  if (is_active !== undefined) {
    if (typeof is_active === 'string') {
      where.is_active = is_active === '1' || is_active === 'true';
    } else {
      where.is_active = !!is_active;
    }
  }

  if (search) {
    where[Op.or] = [
      { name: { [Op.iLike]: `%${search}%` } },
      { email: { [Op.iLike]: `%${search}%` } },
    ];
  }

  const { rows, count } = await User.findAndCountAll({
    where,
    attributes: ['id', 'name', 'email', 'role', 'is_active', 'last_login_at', 'created_at'],
    order: [['created_at', 'DESC']],
    limit,
    offset,
  });

  return { rows, count, totalPages: Math.ceil(count / limit), currentPage: page };
};

// ─── Buscar por ID (admin) ────────────────────────────────────────────────────
const getUserById = async (id) => {
  const user = await User.findByPk(id, {
    attributes: ['id', 'name', 'email', 'role', 'is_active', 'last_login_at', 'created_at', 'updated_at'],
  });

  if (!user) throw new AppError('Usuário não encontrado.', 404);
  return user;
};

// ─── Criar usuário (admin) ────────────────────────────────────────────────────
/**
 * Cria um usuário com senha temporária gerada automaticamente.
 * A senha temporária é retornada UMA VEZ no response — não fica armazenada em texto.
 * last_login_at = null → força troca de senha no primeiro login (mustChangePassword: true).
 *
 * @param {{ name, email, role }} data  — sem campo password (gerado aqui)
 * @returns {{ user: object, temporaryPassword: string }}
 */
const createUser = async ({ name, email, role }) => {
  const existing = await User.findOne({
    where: { email: email.toLowerCase().trim() },
    paranoid: false,
  });
  if (existing) throw new AppError('E-mail já está em uso.', 409);

  const temporaryPassword = _generateTempPassword();

  const user = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password: temporaryPassword,  // hash feito pelo hook beforeCreate
    role,
    is_active: true,
    last_login_at: null,               // null = primeiro login → must change password
  });

  logger.info({ userId: user.id, role: user.role }, 'Usuário criado por admin com senha temporária.');

  return {
    user: user.toJSON(),
    temporaryPassword,  // retornado uma única vez para o admin repassar ao usuário
  };
};

// ─── Atualizar usuário (admin) ────────────────────────────────────────────────
/**
 * Admin pode alterar qualquer campo de qualquer usuário,
 * exceto o próprio role e própria desativação.
 */
const updateUser = async (targetId, requesterId, data) => {
  const user = await User.findByPk(targetId);
  if (!user) throw new AppError('Usuário não encontrado.', 404);

  // Proteções de auto-edição para o próprio admin
  if (targetId === requesterId) {
    if (data.role !== undefined && data.role !== user.role) {
      throw new AppError('Você não pode alterar o próprio papel (role).', 403);
    }
    if (data.is_active === false) {
      throw new AppError('Você não pode desativar a própria conta.', 403);
    }
  }

  if (data.email && data.email !== user.email) {
    const emailInUse = await User.findOne({
      where: { email: data.email.toLowerCase().trim() },
      paranoid: false,
    });
    if (emailInUse) throw new AppError('E-mail já está em uso.', 409);
    data.email = data.email.toLowerCase().trim();
  }

  if (data.password === '' || data.password === null || data.password === undefined) {
    delete data.password;
  }

  await user.update(data);
  logger.info({ targetId, requesterId, changes: Object.keys(data) }, 'Usuário atualizado por admin.');
  return user.toJSON();
};

// ─── Atualizar perfil próprio (user / partner) ────────────────────────────────
/**
 * Permite que qualquer usuário autenticado atualize apenas o próprio nome.
 * E-mail, role e is_active são PROIBIDOS — apenas admin pode alterar esses campos.
 *
 * @param {string} userId - ID do usuário autenticado (req.user.id)
 * @param {{ name: string }} data - Apenas 'name' é aceito (validado pelo Yup antes)
 */
const updateProfile = async (userId, data) => {
  const user = await User.findByPk(userId);
  if (!user) throw new AppError('Usuário não encontrado.', 404);

  // Dupla proteção: garante que só 'name' seja alterado mesmo que o Yup falhe
  const { name } = data;
  if (!name || !name.trim()) throw new AppError('Nome é obrigatório.', 400);

  await user.update({ name: name.trim() });
  logger.info({ userId }, 'Usuário atualizou o próprio perfil.');

  return user.toJSON();
};

// ─── Desativar (admin) ────────────────────────────────────────────────────────
const deactivateUser = async (targetId, requesterId) => {
  if (targetId === requesterId) throw new AppError('Você não pode desativar a própria conta.', 403);

  const user = await User.findByPk(targetId);
  if (!user) throw new AppError('Usuário não encontrado.', 404);
  if (!user.is_active) throw new AppError('Usuário já está desativado.', 409);

  await user.update({ is_active: false });
  logger.info({ targetId, requesterId }, 'Usuário desativado por admin.');
  return { message: `Usuário "${user.name}" desativado com sucesso.` };
};

// ─── Reativar (admin) ─────────────────────────────────────────────────────────
const reactivateUser = async (targetId, requesterId) => {
  if (targetId === requesterId) throw new AppError('Operação inválida sobre a própria conta.', 403);

  const user = await User.findByPk(targetId);
  if (!user) throw new AppError('Usuário não encontrado.', 404);
  if (user.is_active) throw new AppError('Usuário já está ativo.', 409);

  await user.update({ is_active: true });
  logger.info({ targetId, requesterId }, 'Usuário reativado por admin.');
  return { message: `Usuário "${user.name}" reativado com sucesso.` };
};

module.exports = {
  listUsers,
  getUserById,
  createUser,
  updateUser,
  updateProfile,
  deactivateUser,
  reactivateUser,
};
