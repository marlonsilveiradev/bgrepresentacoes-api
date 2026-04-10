const { Sale } = require('./models');
const AppError = require('../../shared/utils/AppError');
const logger = require('../../infrastructure/config/logger');

class SaleRepository {
  constructor() {
    this.model = Sale;
  }

  /**
   * Cria uma nova venda no banco de dados.
   * @param {Object} data - Dados da venda a ser criada.
   * @param {Object} [options] - Opções do Sequelize (ex: { transaction }).
   * @returns {Promise<Sale>} A instância da venda criada.
   * @throws {AppError} Se ocorrer um erro na criação.
   */
  async create(data, options = {}) {
    try {
      const sale = await this.model.create(data, {
        transaction: options.transaction || null,
      });

      logger.debug({ saleId: sale.id }, '[SaleRepository.create] Venda criada com sucesso');

      return sale;
    } catch (error) {
      logger.error(
        { error: error.message, data },
        '[SaleRepository.create] Erro ao criar venda'
      );

      throw new AppError('Erro ao criar venda', 500, 'SALE_CREATION_ERROR');
    }
  }

  /**
   * Busca uma venda pelo seu ID.
   * @param {string} id - ID da venda.
   * @param {Object} [options] - Opções do Sequelize (ex: { transaction }).
   * @returns {Promise<Sale|null>} A instância da venda ou null se não encontrada.
   * @throws {AppError} Se ocorrer um erro na busca.
   */
  async findById(id, options = {}) {
    try {
      const sale = await this.model.findByPk(id, {
        transaction: options.transaction || null,
      });

      if (!sale) {
        logger.debug({ saleId: id }, '[SaleRepository.findById] Venda não encontrada');
        return null;
      }

      return sale;
    } catch (error) {
      logger.error(
        { error: error.message, saleId: id },
        '[SaleRepository.findById] Erro ao buscar venda'
      );

      throw new AppError('Erro ao buscar venda', 500, 'SALE_FETCH_ERROR');
    }
  }

  /**
   * Busca uma venda pelo seu ID, incluindo todas as relações.
   * @param {string} id - ID da venda.
   * @param {Object} [options] - Opções do Sequelize (ex: { transaction }).
   * @returns {Promise<Sale|null>} A instância da venda com relações ou null se não encontrada.
   * @throws {AppError} Se ocorrer um erro na busca.
   */
  async findByIdWithRelations(id, options = {}) {
    try {
      const sale = await this.model.findByPk(id, {
        include: [
          {
            model: this.model.sequelize.models.Client,
            as: 'client',
            attributes: ['id', 'protocol', 'corporate_name', 'cnpj', 'overall_status'],
          },
          {
            model: this.model.sequelize.models.Plan,
            as: 'plan',
            attributes: ['id', 'name', 'price'],
          },
          {
            model: this.model.sequelize.models.User,
            as: 'seller',
            attributes: ['id', 'name', 'email'],
          },
          {
            model: this.model.sequelize.models.User,
            as: 'partner',
            attributes: ['id', 'name', 'email'],
          },
          {
            model: this.model.sequelize.models.SaleFlag,
            as: 'saleFlags',
            include: [
              {
                model: this.model.sequelize.models.Flag,
                as: 'flag',
                attributes: ['id', 'name', 'price'],
              },
            ],
          },
        ],
        transaction: options.transaction || null,
      });

      if (!sale) {
        logger.debug({ saleId: id }, '[SaleRepository.findByIdWithRelations] Venda não encontrada');
        return null;
      }

      return sale;
    } catch (error) {
      logger.error(
        { error: error.message, saleId: id },
        '[SaleRepository.findByIdWithRelations] Erro ao buscar venda com relações'
      );

      throw new AppError('Erro ao buscar venda com relações', 500, 'SALE_FETCH_RELATIONS_ERROR');
    }
  }

  /**
   * Lista todas as vendas com opções de filtro, paginação e ordenação.
   * @param {Object} [options] - Opções de query (where, limit, offset, order, include, transaction).
   * @returns {Promise<{rows: Sale[], count: number}>} Lista de vendas e contagem total.
   * @throws {AppError} Se ocorrer um erro na listagem.
   */
  async findAll(options = {}) {
    const {
      where = {},
      limit = 20,
      offset = 0,
      order = [['created_at', 'DESC']],
      include = [],
      transaction = null,
    } = options;

    try {
      const result = await this.model.findAndCountAll({
        where,
        limit,
        offset,
        order,
        include: [
          {
            model: this.model.sequelize.models.Client,
            as: 'client',
            attributes: ['id', 'protocol', 'corporate_name', 'cnpj'],
          },
          {
            model: this.model.sequelize.models.Plan,
            as: 'plan',
            attributes: ['id', 'name'],
          },
          {
            model: this.model.sequelize.models.User,
            as: 'seller',
            attributes: ['id', 'name'],
          },
          ...include,
        ],
        transaction,
        raw: false,
      });

      logger.debug(
        { count: result.count, limit, offset },
        '[SaleRepository.findAll] Vendas listadas com sucesso'
      );

      return result;
    } catch (error) {
      logger.error(
        { error: error.message, where, limit, offset },
        '[SaleRepository.findAll] Erro ao listar vendas'
      );

      throw new AppError('Erro ao listar vendas', 500, 'SALES_LIST_ERROR');
    }
  }

  /**
   * Atualiza uma venda existente.
   * @param {string} id - ID da venda a ser atualizada.
   * @param {Object} data - Dados para atualização.
   * @param {Object} [options] - Opções do Sequelize (ex: { transaction }).
   * @returns {Promise<Sale>} A instância da venda atualizada.
   * @throws {AppError} Se a venda não for encontrada ou ocorrer um erro.
   */
  async update(id, data, options = {}) {
    try {
      const sale = await this.model.findByPk(id, {
        transaction: options.transaction || null,
      });

      if (!sale) {
        logger.warn({ saleId: id }, '[SaleRepository.update] Venda não encontrada');
        throw new AppError('Venda não encontrada', 404, 'SALE_NOT_FOUND');
      }

      const updatedSale = await sale.update(data, {
        transaction: options.transaction || null,
      });

      logger.debug({ saleId: id }, '[SaleRepository.update] Venda atualizada com sucesso');

      return updatedSale;
    } catch (error) {
      if (error instanceof AppError) throw error;

      logger.error(
        { error: error.message, saleId: id, data },
        '[SaleRepository.update] Erro ao atualizar venda'
      );

      throw new AppError('Erro ao atualizar venda', 500, 'SALE_UPDATE_ERROR');
    }
  }

  /**
   * Realiza um soft delete (marca como deletado) em uma venda.
   * Requer que o model Sale tenha `paranoid: true`.
   * @param {string} id - ID da venda a ser deletada.
   * @param {Object} [options] - Opções do Sequelize (ex: { transaction }).
   * @returns {Promise<boolean>} True se a venda foi deletada, false caso contrário.
   * @throws {AppError} Se a venda não for encontrada ou ocorrer um erro.
   */
  async delete(id, options = {}) {
    try {
      const sale = await this.model.findByPk(id, {
        transaction: options.transaction || null,
      });

      if (!sale) {
        logger.warn({ saleId: id }, '[SaleRepository.delete] Venda não encontrada');
        throw new AppError('Venda não encontrada', 404, 'SALE_NOT_FOUND');
      }

      await sale.destroy({
        transaction: options.transaction || null,
      });

      logger.debug({ saleId: id }, '[SaleRepository.delete] Venda deletada com sucesso');

      return true;
    } catch (error) {
      if (error instanceof AppError) throw error;

      logger.error(
        { error: error.message, saleId: id },
        '[SaleRepository.delete] Erro ao deletar venda'
      );

      throw new AppError('Erro ao deletar venda', 500, 'SALE_DELETE_ERROR');
    }
  }
}

module.exports = SaleRepository;