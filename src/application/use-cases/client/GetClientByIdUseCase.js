const AppError = require('../../../shared/utils/AppError');
const logger = require('../../../infrastructure/config/logger');
const { ROLES } = require('../../../shared/constants/roles');
const { buildPartnerClientView } = require('../../../shared/helpers/partnerClientView');

class GetClientByIdUseCase {
  constructor(clientRepository) {
    this.clientRepository = clientRepository;
  }

  async execute(clientId, requester) {
    try {
      const isPartner = requester.role === ROLES.PARTNER;
      const client = isPartner
        ? await this.clientRepository.findByIdWithPartnerView(clientId)
        : await this.clientRepository.findById(clientId);

      if (!client) {
        throw new AppError('Cliente não encontrado.', 404, 'CLIENT_NOT_FOUND');
      }

      // ✅ Controle de acesso
      this._assertCanRead(client, requester);

      if (isPartner) {
        return buildPartnerClientView(client);
      }

      return client.toJSON();

    } catch (error) {
      if (error instanceof AppError) throw error;
      
      logger.error(
        { error: error.message, clientId, userId: requester.id },
        '[GetClientByIdUseCase] Erro ao buscar cliente'
      );
      
      throw new AppError('Erro ao buscar cliente', 500, 'CLIENT_FETCH_ERROR');
    }
  }

  _assertCanRead(client, requester) {
    if (requester.role === ROLES.ADMIN) {
      return;
    }

    if (requester.role === ROLES.PARTNER) {
      if (client.partner_id !== requester.id) {
        throw new AppError('Cliente não encontrado.', 404, 'CLIENT_NOT_FOUND');
      }
      return;
    }

    if (requester.role === ROLES.USER) {
      if (client.created_by !== requester.id) {
        throw new AppError('Cliente não encontrado.', 404, 'CLIENT_NOT_FOUND');
      }
      return;
    }

    throw new AppError('Cliente não encontrado.', 404, 'CLIENT_NOT_FOUND');
  }
}

module.exports = GetClientByIdUseCase;