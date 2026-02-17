'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // ═════════════════════════════════════════════════════════
    // PLANOS PADRÃO
    // ═════════════════════════════════════════════════════════

    await queryInterface.bulkInsert('plans', [
      {
        id: Sequelize.literal('uuid_generate_v4()'),
        name: 'Individual',
        code: 'individual',
        description: 'Escolha bandeiras individualmente. Preço = soma das bandeiras.',
        flag_count: 0,
        price: 0.00,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: Sequelize.literal('uuid_generate_v4()'),
        name: 'Combo 5 Bandeiras',
        code: 'combo_5',
        description: 'Pacote com 5 bandeiras',
        flag_count: 5,
        price: 150.00,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: Sequelize.literal('uuid_generate_v4()'),
        name: 'Combo 7 Bandeiras',
        code: 'combo_7',
        description: 'Todas as 7 bandeiras',
        flag_count: 7,
        price: 200.00,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);

    // ═════════════════════════════════════════════════════════
    // BANDEIRAS PADRÃO
    // ═════════════════════════════════════════════════════════

    await queryInterface.bulkInsert('flags', [
      {
        id: Sequelize.literal('uuid_generate_v4()'),
        name: 'Alelo',
        code: 'alelo',
        description: 'Alelo Alimentação/Refeição',
        price: 35.00,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: Sequelize.literal('uuid_generate_v4()'),
        name: 'VR',
        code: 'vr',
        description: 'VR Benefícios',
        price: 35.00,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: Sequelize.literal('uuid_generate_v4()'),
        name: 'Sodexo',
        code: 'sodexo',
        description: 'Sodexo Pass',
        price: 35.00,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: Sequelize.literal('uuid_generate_v4()'),
        name: 'Ticket',
        code: 'ticket',
        description: 'Ticket Alimentação/Refeição',
        price: 35.00,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: Sequelize.literal('uuid_generate_v4()'),
        name: 'Ben Visa Vale',
        code: 'ben_visa_vale',
        description: 'Ben Visa Vale',
        price: 35.00,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: Sequelize.literal('uuid_generate_v4()'),
        name: 'Greencard',
        code: 'greencard',
        description: 'Greencard',
        price: 35.00,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: Sequelize.literal('uuid_generate_v4()'),
        name: 'Planvale',
        code: 'planvale',
        description: 'Planvale',
        price: 35.00,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('plans', null, {});
    await queryInterface.bulkDelete('flags', null, {});
  }
};