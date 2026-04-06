/**
 * USE CASE: Criar Venda
 * Cria venda associada ao cliente
 */

const { Sale } = require('../../../infrastructure/repositories/models');

class CreateSaleUseCase {
  async execute(clientId, planData, totalValue, soldById, transaction) {
    const sale = await Sale.create(
      {
        client_id: clientId,
        plan_id: planData?.id ?? null,
        total_value: totalValue,
        plan_name: planData?.name ?? 'Bandeiras Individuais',
        plan_price: planData?.price ?? 0,
        sold_by: soldById,
        status: 'pending',
      },
      { transaction }
    );

    return sale;
  }
}

module.exports = CreateSaleUseCase;