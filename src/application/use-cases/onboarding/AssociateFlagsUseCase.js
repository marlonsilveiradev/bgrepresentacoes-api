/**
 * USE CASE: Associar Bandeiras
 * Associa bandeiras à venda e ao cliente
 */

const { SaleFlag, ClientFlag } = require('../../../infrastructure/repositories/models');

class AssociateFlagsUseCase {
  async execute(saleId, clientId, flags, transaction) {
    if (!flags || flags.length === 0) return;

    // Salvar em sale_flags
    await SaleFlag.bulkCreate(
      flags.map(f => ({
        sale_id: saleId,
        flag_id: f.id,
        price: f.price,
        status: 'pending',
      })),
      { transaction }
    );

    // Salvar em client_flags
    await ClientFlag.bulkCreate(
      flags.map(f => ({
        client_id: clientId,
        flag_id: f.id,
        status: 'pending',
      })),
      { transaction }
    );
  }
}

module.exports = AssociateFlagsUseCase;