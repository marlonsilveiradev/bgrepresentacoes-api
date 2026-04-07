/**
 * REPOSITÓRIO: UserRepository
 * Implementa IUserRepository
 * Responsabilidade: Acessar BD e transformar em entidades
 */

const { Op, where } = require('sequelize');
const { User: UserModel } = require('./models');
const IUserRepository = require('../../domain/interfaces/IUserRepository');
const User = require('../../domain/entities/User');
const AppError = require('../../shared/utils/AppError');
const logger = require('../config/logger');

class UserRepository extends IUserRepository {
  // === Métodos AUTH (mantém os anteriores) ===

  async findByEmail(email) {
    try {
      const user = await UserModel.findOne({
        where: { email: email.toLowerCase().trim() },
        attributes: [
          'id',
          'name',
          'email',
          'password',
          'role',
          'is_active',
          'last_login_at',
          'created_at'
        ],
        raw: false,
      });
      if (!user) return null;
      return this.modelToEntity(user);
    } catch (error) {
      logger.error('[UserRepository.findByEmail] Erro:', error.message);
      throw error;
    }
  }

  async findByIdWithPassword(userId) {
    try {
      const user = await UserModel.findByPk(userId, {
        attributes: ['id', 'password', 'is_active', 'last_login_at'],
      });
      return user;
    } catch (error) {
      logger.error('[UserRepository.findByIdWithPassword] Erro:', error.message);
      throw error;
    }
  }

  async findById(userId) {
    try {
      const user = await UserModel.findByPk(userId, {
        attributes: [
          'id',
          'name',
          'email',
          'role',
          'is_active',
          'last_login_at',
          'created_at',
          'updated_at',
        ],
        raw:false,
      });
      if (!user) return null;
      return this.modelToEntity(user);
    } catch (error) {
      logger.error('[UserRepository.findById] Erro:', error.message);
      throw error;
    }
  }

  async updatePassword(userId, newPassword) {
    try {
      const user = await UserModel.findByPk(userId);
      if (!user) {
        throw new AppError('Usuário não encontrado', 404);
      }
      await user.update({ password: newPassword }, { hooks: true });
      logger.info({ userId }, 'Senha atualizada');
      return user;
    } catch (error) {
      logger.error('[UserRepository.updatePassword] Erro:', error.message);
      throw error;
    }
  }

  async updateLastLogin(userId) {
    try {
      const user = await UserModel.findByPk(userId);
      if (!user) {
        throw new AppError('Usuário não encontrado', 404);
      }
      await user.update(
        { last_login_at: new Date() },
        {
          where: { id: userId },
          individualHooks: true,
        },
        { hooks: false }
      );
      logger.info({ userId }, 'Last login atualizado');
      return user;
    } catch (error) {
      logger.error('[UserRepository.updateLastLogin] Erro:', error.message);
      throw error;
    }
  }

  // === Métodos USER MANAGEMENT (novos) ===

  /**
   * Listar usuários com filtros e paginação
   */
  async list(filters = {}) {
    try {
      const { page = 1, limit = 20, role, is_active, search } = filters;
      const offset = (page - 1) * limit;

      // Construir WHERE clause
      const where = {};

      if (role !== undefined) {
        where.role = role;
      }

      if (is_active !== undefined) {
        where.is_active = is_active;
      }

      if (search) {
        where[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { email: { [Op.iLike]: `%${search}%` } },
        ];
      }

      const { rows, count } = await UserModel.findAndCountAll({
        where,
        attributes: [
          'id',
          'name',
          'email',
          'role',
          'is_active',
          'last_login_at',
          'created_at',
        ],
        order: [['created_at', 'DESC']],
        limit,
        offset,
      });

      const entities = rows.map(model => this.modelToEntity(model));
      const totalPages = Math.ceil(count / limit);

      return {
        data:entities,
        total: count,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      logger.error('[UserRepository.list] Erro:', error.message);
      throw error;
    }
  }

  /**
   * Criar novo usuário
   */
  async create(user, password) {
    try {
      const model = await UserModel.create({
        id: user.id,
        name: user.name,
        email: user.email,
        password: password,
        role: user.role,
        is_active: user.is_active,
        last_login_at: user.last_login_at,
      });

      return this.modelToEntity(model);
    } catch (error) {
      logger.error('[UserRepository.create] Erro:', error.message);
      throw error;
    }
  }

  /**
   * Atualizar usuário
   */
  async update(userId, data) {
    try {
      const model = await UserModel.findByPk(userId);

      if (!model) {
        return null;
      }

      // Atualizar apenas campos fornecidos
      const updateData = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.email !== undefined) updateData.email = data.email;
      if (data.role !== undefined) updateData.role = data.role;
      if (data.is_active !== undefined) updateData.is_active = data.is_active;

      await model.update(updateData);

      return this.modelToEntity(model);
    } catch (error) {
      logger.error('[UserRepository.update] Erro:', error.message);
      throw error;
    }
  }

  /**
   * Verificar se email está em uso
   */
  async isEmailInUse(email, excludeUserId = null) {
    try {
      const where = { email: email.toLowerCase().trim() };

      if (excludeUserId) {
        where.id = { [Op.ne]: excludeUserId };
      }

      const user = await UserModel.findOne({ where, paranoid: false });
      return !!user;
    } catch (error) {
      logger.error('[UserRepository.isEmailInUse] Erro:', error.message);
      throw error;
    }
  }

  /**
   * Desativar usuário
   */
  async deactivate(userId) {
    try {
      const model = await UserModel.findByPk(userId);

      if (!model) {
        throw new AppError('Usuário não encontrado', 404);
      }

      await model.update({ is_active: false });

      logger.info({ userId }, 'Usuário desativado');

      return this.modelToEntity(model);
    } catch (error) {
      logger.error('[UserRepository.deactivate] Erro:', error.message);
      throw error;
    }
  }

  /**
   * Reativar usuário
   */
  async reactivate(userId) {
    try {
      const model = await UserModel.findByPk(userId);

      if (!model) {
        throw new AppError('Usuário não encontrado', 404);
      }

      await model.update({ is_active: true });

      logger.info({ userId }, 'Usuário reativado');

      return this.modelToEntity(model);
    } catch (error) {
      logger.error('[UserRepository.reactivate] Erro:', error.message);
      throw error;
    }
  }

  /**
   * Transformar Sequelize model em Entity User
   */
  modelToEntity(model) {
    return new User({
      id: model.id,
      name: model.name,
      email: model.email,
      role: model.role,
      is_active: model.is_active,
      last_login_at: model.last_login_at,
      created_at: model.created_at,
      updated_at: model.updated_at,
    });
  }
}

module.exports = UserRepository;