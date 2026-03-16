'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('plans', [
      {
        id: Sequelize.literal('gen_random_uuid()'),
        name: 'Combo 5 Bandeiras',
        description: 'Plano com 5 bandeiras',
        price: 199.90,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: Sequelize.literal('gen_random_uuid()'),
        name: 'Combo 7 Bandeiras',
        description: 'Plano com 7 bandeiras',
        price: 349.90,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: Sequelize.literal('gen_random_uuid()'),
        name: 'Combo 7 Bandeiras',
        description: 'Plano completo',
        price: 399.90,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('plans', null, {});
  }
};