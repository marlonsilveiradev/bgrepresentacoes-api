const UpdateClientFlagStatusUseCase = require('../../application/use-cases/client/UpdateClientFlagStatusUseCase');
const logger = require('../../../infrastructure/config/logger');

class ClientFlagController {
  static async updateStatus(req, res, next) {
    try {
      const { id } = req.params;
      const useCase = new UpdateClientFlagStatusUseCase(
        req.app.locals.clientFlagRepository,
        req.app.locals.sequelize
      );

      const updatedFlag = await useCase.execute(id, req.user, req.body);

      logger.info(
        { flagId: id, userId: req.user.id },
        '[ClientFlagController.updateStatus] Status atualizado'
      );

      return res.json(updatedFlag);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ClientFlagController;