'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const machines = [
      { name: 'Stone', code: 'STONE', is_active: true },
      { name: 'PagSeguro', code: 'PAGSEGURO', is_active: true },
      { name: 'Rede', code: 'REDE', is_active: true },
      { name: 'Cielo', code: 'CIELO', is_active: true },
      { name: 'Sipag', code: 'SIPAG', is_active: true },
      { name: 'Bin', code: 'BIN', is_active: true },
      { name: 'Mercado Pago', code: 'MERCADOPAGO', is_active: true },
      { name: 'Ton', code: 'TON', is_active: true },
      { name: 'Sicredi', code: 'SICREDI', is_active: true },
      { name: 'Vero', code: 'VERO', is_active: true },
      { name: 'SumUp', code: 'SUMUP', is_active: true },
      { name: 'Caixa', code: 'CAIXA', is_active: true },
    ];

    const records = machines.map(m => ({
      id: Sequelize.literal('gen_random_uuid()'),
      name: m.name,
      code: m.code,
      is_active: m.is_active,
      created_at: new Date(),
      updated_at: new Date(),
    }));

    await queryInterface.bulkInsert('machines', records);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('machines', null, {});
  },
};