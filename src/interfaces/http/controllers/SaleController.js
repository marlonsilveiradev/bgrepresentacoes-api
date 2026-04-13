const CreateSaleUseCase = require('../../../application/use-cases/sale/CreateSaleUseCase');
const GetSaleByIdUseCase = require('../../../application/use-cases/sale/GetSaleByIdUseCase');
const ListSalesUseCase = require('../../../application/use-cases/sale/ListSalesUseCase');
const UpdateSaleStatusUseCase = require('../../../application/use-cases/sale/UpdateSaleStatusUseCase');
const CancelSaleUseCase = require('../../../application/use-cases/sale/CancelSaleUseCase');
const logger = require('../../../infrastructure/config/logger');

class SaleController {
  static async list(req, res, next) {
    try {
      const useCase = new ListSalesUseCase(req.app.locals.saleRepository);
      const result = await useCase.execute(req.query, req.user);

      return res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req, res, next) {
    try {
      const { id } = req.params;
      const useCase = new GetSaleByIdUseCase(req.app.locals.saleRepository);
      const sale = await useCase.execute(id, req.user);

      return res.json(sale);
    } catch (error) {
      next(error);
    }
  }

  static async create(req, res, next) {
    try {
      const useCase = new CreateSaleUseCase(
        req.app.locals.saleRepository,
        req.app.locals.saleFlagRepository,
        req.app.locals.clientRepository,
        req.app.locals.planRepository,
        req.app.locals.flagRepository,
        req.app.locals.clientFlagRepository,
        req.app.locals.sequelize
      );

      const sale = await useCase.execute(req.user, req.body);

      logger.info(
        { saleId: sale.id, userId: req.user.id },
        '[SaleController.create] Venda criada com sucesso'
      );

      return res.status(201).json({
        message: 'Venda registrada com sucesso.',
        data: sale,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateStatus(req, res, next) {
    try {
      const { id } = req.params;
      const useCase = new UpdateSaleStatusUseCase(
        req.app.locals.saleRepository,
        req.app.locals.clientFlagRepository,
        req.app.locals.sequelize
      );

      const sale = await useCase.execute(id, req.user, req.body);

      logger.info(
        { saleId: id, userId: req.user.id },
        '[SaleController.updateStatus] Status atualizado'
      );

      return res.json({
        message: 'Status da venda atualizado.',
        data: sale,
      });
    } catch (error) {
      next(error);
    }
  }

  static async cancel(req, res, next) {
    try {
      const { id } = req.params;
      const useCase = new CancelSaleUseCase(
        req.app.locals.saleRepository,
        req.app.locals.clientFlagRepository,
        req.app.locals.sequelize
      );

      const sale = await useCase.execute(id, req.user, req.body);

      logger.info(
        { saleId: id, userId: req.user.id },
        '[SaleController.cancel] Venda cancelada'
      );

      return res.json({
        message: 'Venda cancelada com sucesso.',
        data: sale,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = SaleController;