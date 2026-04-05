/**
 * REPOSITÓRIO: FlagRepository
 * 
 * Implementa a interface IFlagRepository.
 * Responsabilidade: Acessar BD (Sequelize models) e transformar em Flags do domínio.
 * 
 * ✅ O que faz:
 * - Queries ao BD
 * - Transformar Sequelize model → Flag entity
 * 
 * ❌ O que NÃO faz:
 * - Lógica de negócio
 * - Validação (domínio faz isso)
 * - HTTP/Cache
 */

const { Op } = require('sequelize');
const Flag = require('../../domain/entities/Flag');
const IFlagRepository = require('../../domain/interfaces/IFlagRepository');
const { Flag: FlagModel } = require('./models');

class FlagRepository extends IFlagRepository {
  /**
   * Buscar flag por ID
   */
  async findById(id) {
    try {
      const model = await FlagModel.findByPk(id, {
        attributes: ['id', 'name', 'description', 'price', 'is_active', 'created_at', 'updated_at'],
      });

      if (!model) return null;

      // Transformar Sequelize model → Flag entity
      return this.modelToEntity(model);
    } catch (error) {
      console.error('[FlagRepository.findById] Erro:', error.message);
      throw error;
    }
  }

  /**
   * Buscar flag por nome
   */
  async findByName(name) {
    try {
      const model = await FlagModel.findOne({
        where: { name: name.trim() },
        attributes: ['id', 'name', 'description', 'price', 'is_active', 'created_at', 'updated_at'],
      });

      if (!model) return null;

      return this.modelToEntity(model);
    } catch (error) {
      console.error('[FlagRepository.findByName] Erro:', error.message);
      throw error;
    }
  }

  /**
   * Listar flags com paginação e filtros
   */
  async list({ page = 1, limit = 20, is_active, search } = {}) {
    try {
      // Construir WHERE clause
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

      const offset = (page - 1) * limit;

      const { rows, count } = await FlagModel.findAndCountAll({
        where,
        attributes: ['id', 'name', 'description', 'price', 'is_active', 'created_at', 'updated_at'],
        order: [['name', 'ASC']],
        limit,
        offset,
      });

      const data = rows.map(model => this.modelToEntity(model));
      const totalPages = Math.ceil(count / limit);

      return {
        data,
        total: count,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      console.error('[FlagRepository.list] Erro:', error.message);
      throw error;
    }
  }

  /**
   * Criar nova flag
   */
  async create(flag) {
    try {
      // flag é uma instância de Flag (entidade do domínio)
      const model = await FlagModel.create({
        id: flag.id,
        name: flag.name,
        description: flag.description,
        price: flag.price,
        is_active: flag.is_active,
      });

      return this.modelToEntity(model);
    } catch (error) {
      console.error('[FlagRepository.create] Erro:', error.message);
      throw error;
    }
  }

  /**
   * Atualizar flag
   */
  async update(id, data) {
    try {
      const model = await FlagModel.findByPk(id);

      if (!model) {
        return null;
      }

      // Atualizar apenas campos fornecidos
      const updateData = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.price !== undefined) updateData.price = data.price;
      if (data.is_active !== undefined) updateData.is_active = data.is_active;

      await model.update(updateData);

      return this.modelToEntity(model);
    } catch (error) {
      console.error('[FlagRepository.update] Erro:', error.message);
      throw error;
    }
  }

  /**
   * Deletar flag
   */
  async delete(id) {
    try {
      const model = await FlagModel.findByPk(id);

      if (!model) {
        throw new Error('Flag não encontrada');
      }

      await model.destroy();
    } catch (error) {
      console.error('[FlagRepository.delete] Erro:', error.message);
      throw error;
    }
  }

  /**
   * ⭐ MÉTODO PRIVADO: Transformar Sequelize model em Flag entity
   * Esta é a "cola" que transforma dados do BD em objetos do domínio
   */
  modelToEntity(model) {
    return new Flag({
      id: model.id,
      name: model.name,
      description: model.description,
      price: model.price,
      is_active: model.is_active,
      created_at: model.created_at,
      updated_at: model.updated_at,
    });
  }
}

module.exports = FlagRepository;