const GetClientByIdUseCase = require('../../../application/use-cases/client/GetClientByIdUseCase');
const ListClientsUseCase = require('../../../application/use-cases/client/ListClientsUseCase');
const UpdateClientUseCase = require('../../../application/use-cases/client/UpdateClientUseCase');
const logger = require('../../../infrastructure/config/logger');

class ClientController {
  static async getById(req, res, next) {
    try {
      const { id } = req.params;
      const useCase = new GetClientByIdUseCase(req.app.locals.clientRepository);
      const client = await useCase.execute(id, req.user);

      return res.json(client);
    } catch (error) {
      next(error);
    }
  }

  static async list(req, res, next) {
    try {
      const useCase = new ListClientsUseCase(req.app.locals.clientRepository);
      const result = await useCase.execute(req.query, req.user);

      return res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async updateClient(req, res, next) {
    try {
      const { id } = req.params;
      const useCase = new UpdateClientUseCase(
        req.app.locals.clientRepository,
        req.app.locals.clientBankAccountRepository,
        req.app.locals.clientDocumentRepository,
        req.app.locals.processClientDocumentsUseCase,
        req.app.locals.storageRepository,
        req.app.locals.sequelize
      );

      const updatedClient = await useCase.execute(id, req.body, req.user, req.files);

      logger.info(
        { clientId: id, userId: req.user.id },
        '[ClientController.updateClient] Cliente atualizado'
      );

      return res.json(updatedClient);
    } catch (error) {
      next(error);
    }
  }

  static async trackByProtocol(req, res, next) {
    try {
      const { protocol } = req.params;
      const client = await req.app.locals.clientRepository.findByProtocol(protocol);

      if (!client) {
        return res.status(404).json({
          error: 'Cliente não encontrado',
          code: 'CLIENT_NOT_FOUND',
        });
      }

      return res.json({
        protocol: client.protocol,
        corporate_name: client.corporate_name,
        overall_status: client.overall_status,
        created_at: client.created_at,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ClientController;