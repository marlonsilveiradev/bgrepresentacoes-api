const { Op } = require('sequelize');
const { User } = require('../repositories/models');
const AppError = require('../../shared/utils/AppError');
const logger = require('../../infrastructure/config/logger');
const crypto = require('node:crypto');

class UserService {
  // ========== Métodos públicos ==========

  async listUsers({ page = 1, limit = 20, role, is_active, search } = {}) {
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

    return {
      rows,
      count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
    };
  }

  async getUserById(id) {
    const user = await User.findByPk(id, {
      attributes: ['id', 'name', 'email', 'role', 'is_active', 'last_login_at', 'created_at', 'updated_at'],
    });
    if (!user) throw new AppError('Usuário não encontrado.', 404);
    return user;
  }

  async createUser({ name, email, role }) {
    const existing = await User.findOne({
      where: { email: email.toLowerCase().trim() },
      paranoid: false,
    });
    if (existing) throw new AppError('E-mail já está em uso.', 409);

    const temporaryPassword = this._generateTempPassword();

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: temporaryPassword,
      role,
      is_active: true,
      last_login_at: null,
    });

    logger.info({ userId: user.id, role: user.role }, 'Usuário criado por admin com senha temporária.');

    // Retorna o objeto JSON (sem a senha)
    return {
      user: user.toJSON(),
      temporaryPassword,
    };
  }

  async updateUser(targetId, requesterId, data) {
    const user = await User.findByPk(targetId);
    if (!user) throw new AppError('Usuário não encontrado.', 404);

    // Proteções de auto-edição
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
  }

  async updateProfile(userId, data) {
    const user = await User.findByPk(userId);
    if (!user) throw new AppError('Usuário não encontrado.', 404);

    const { name } = data;
    if (!name || !name.trim()) throw new AppError('Nome é obrigatório.', 400);

    await user.update({ name: name.trim() });
    logger.info({ userId }, 'Usuário atualizou o próprio perfil.');
    return user.toJSON();
  }

  async deactivateUser(targetId, requesterId) {
    if (targetId === requesterId) throw new AppError('Você não pode desativar a própria conta.', 403);

    const user = await User.findByPk(targetId);
    if (!user) throw new AppError('Usuário não encontrado.', 404);
    if (!user.is_active) throw new AppError('Usuário já está desativado.', 409);

    await user.update({ is_active: false });
    logger.info({ targetId, requesterId }, 'Usuário desativado por admin.');
    return { message: `Usuário "${user.name}" desativado com sucesso.` };
  }

  async reactivateUser(targetId, requesterId) {
    if (targetId === requesterId) throw new AppError('Operação inválida sobre a própria conta.', 403);

    const user = await User.findByPk(targetId);
    if (!user) throw new AppError('Usuário não encontrado.', 404);
    if (user.is_active) throw new AppError('Usuário já está ativo.', 409);

    await user.update({ is_active: true });
    logger.info({ targetId, requesterId }, 'Usuário reativado por admin.');
    return { message: `Usuário "${user.name}" reativado com sucesso.` };
  }

  async getProfile(userId) {
    const user = await this.getUserById(userId);
    return {
      ...user.toJSON(),
      mustChangePassword: user.last_login_at === null,
    };
  }

  // ========== Métodos privados ==========

  _generateTempPassword() {
    const chars = 'abcdefghijklmnopqrstuvwxyz';
    const nums = '0123456789';
    const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const specials = '!@#$%';

    const randomStr = (src, len) => {
      return Array.from({ length: len }, () => {
        const randomIndex = crypto.randomInt(0, src.length);
        return src[randomIndex];
      }).join('');
    };

    const part1 = randomStr(upper, 1);
    const part2 = randomStr(chars, 4);
    const part3 = randomStr(nums, 4);
    const part4 = randomStr(specials, 1);

    return `${part1}${part2}-${part3}${part4}`;
  }
}

module.exports = new UserService();