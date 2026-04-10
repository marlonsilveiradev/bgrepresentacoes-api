const AppError = require('../../../shared/utils/AppError');
const logger = require('../../../infrastructure/config/logger');
const { ROLES } = require('../../../shared/constants/roles');

class GetClientByIdUseCase {
  constructor(clientRepository) {
    this.clientRepository = clientRepository;
  }

  async execute(clientId, requester) {
    try {
      const client = await this.clientRepository.findById(clientId);

      if (!client) {
        throw new AppError('Cliente não encontrado.', 404, 'CLIENT_NOT_FOUND');
      }

      // ✅ Controle de acesso
      this._assertCanRead(client, requester);

      // ✅ Formatação de resposta
      const clientJson = client.toJSON();
      
      if (requester.role === ROLES.PARTNER) {
        return this._filterPartnerClient(clientJson);
      }

      return clientJson;

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
    const isAdmin = requester.role === ROLES.ADMIN;
    const isOwner = client.created_by === requester.id;
    const isPartner = requester.role === ROLES.PARTNER && client.partner_id === requester.id;

    if (!isAdmin && !isOwner && !isPartner) {
      throw new AppError('Você não tem permissão para visualizar este cliente.', 403);
    }
  }

  _filterPartnerClient(data) {
    return {
      id: data.id,
      protocol: data.protocol,
      corporate_name: data.corporate_name,
      trade_name: data.trade_name,
      responsible_name: data.responsible_name,
      cnpj: data.cnpj,
      phone: data.phone,
      email: data.email,
      address_street: data.address_street,
      address_number: data.address_number,
      address_complement: data.address_complement,
      address_neighborhood: data.address_neighborhood,
      address_city: data.address_city,
      address_state: data.address_state,
      address_zip: data.address_zip,
      overall_status: data.overall_status,
      created_at: data.created_at,
    };
  }
}

module.exports = GetClientByIdUseCase;