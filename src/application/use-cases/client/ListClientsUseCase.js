const AppError = require('../../../shared/utils/AppError');
const logger = require('../../../infrastructure/config/logger');
const { ROLES } = require('../../../shared/constants/roles');

class ListClientsUseCase {
  constructor(clientRepository) {
    this.clientRepository = clientRepository;
  }

  async execute(filters, requester) {
    try {
      const { page = 1, limit = 20, overall_status, benefit_type, partner_id, search } = filters;

      // ✅ Filtros aplicados ao papel do usuário
      const accessFilter = this._buildAccessFilter(requester, partner_id);

      const { rows, count } = await this.clientRepository.findAll({
        where: { ...accessFilter, overall_status, benefit_type, search },
        limit,
        offset: (page - 1) * limit,
        order: [['created_at', 'DESC']],
      });

      // ✅ Filtrar resposta se for parceiro
      let clients = rows;
      if (requester.role === ROLES.PARTNER) {
        clients = rows.map(c => this._filterPartnerClient(c.toJSON()));
      }

      return {
        data: clients,
        pagination: {
          page,
          limit,
          total: count,
          pages: Math.ceil(count / limit),
        },
      };

    } catch (error) {
      if (error instanceof AppError) throw error;
      
      logger.error(
        { error: error.message, userId: requester.id },
        '[ListClientsUseCase] Erro ao listar clientes'
      );
      
      throw new AppError('Erro ao listar clientes', 500, 'CLIENTS_LIST_ERROR');
    }
  }

  _buildAccessFilter(requester, partner_id) {
    if (requester.role === ROLES.ADMIN) {
      return {}; // Admin vê todos
    }

    if (requester.role === ROLES.PARTNER) {
      return { partner_id: requester.id }; // Partner só vê seus clientes
    }

    return { created_by: requester.id }; // User só vê clientes que criou
  }

  _filterPartnerClient(data) {
    return {
      id: data.id,
      protocol: data.protocol,
      corporate_name: data.corporate_name,
      overall_status: data.overall_status,
      created_at: data.created_at,
    };
  }
}

module.exports = ListClientsUseCase;