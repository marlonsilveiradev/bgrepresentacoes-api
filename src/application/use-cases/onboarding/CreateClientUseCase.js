/**
 * USE CASE: Criar Cliente
 * Cria apenas o cliente (sem dependências de venda/bandeiras)
 */

const { Client } = require('../../../infrastructure/repositories/models');
const AppError = require('../../../shared/utils/AppError');
const { generateProtocol } = require('../../../shared/utils/protocol');
const { v4: uuid } = require('uuid');

class CreateClientUseCase {
  async execute(requester, clientData, transaction) {
    // Verificar unicidade de CNPJ
    const existingByCnpj = await Client.findOne({
      where: { cnpj: clientData.cnpj },
    });

    if (existingByCnpj) {
      throw new AppError('CNPJ já cadastrado no sistema', 409);
    }

    // Criar cliente
    const client = await Client.create(
      {
        id: uuid(),
        protocol: generateProtocol(),
        corporate_name: clientData.corporate_name.trim(),
        trade_name: clientData.trade_name?.trim() || null,
        cnpj: clientData.cnpj,
        responsible_name: clientData.responsible_name.trim(),
        state_registration: clientData.state_registration || null,
        address_street: clientData.address.street,
        address_number: clientData.address.number,
        address_complement: clientData.address.complement,
        address_neighborhood: clientData.address.neighborhood,
        address_city: clientData.address.city,
        address_state: clientData.address.state,
        address_zip: clientData.address.zip,
        overall_status: 'pending',
        created_by: requester.id,
        partner_id: clientData.partner_id || null,
      },
      { transaction }
    );

    return client;
  }
}

module.exports = CreateClientUseCase;