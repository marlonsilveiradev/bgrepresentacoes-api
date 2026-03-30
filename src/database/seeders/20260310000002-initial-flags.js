'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('flags', [
      {
        id: Sequelize.literal('gen_random_uuid()'),
        name: 'Alelo',
        description: 'Bandeira Alelo',
        price: 89.9,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: Sequelize.literal('gen_random_uuid()'),
        name: 'Sodexo',
        description: 'Bandeira Sodexo',
        price: 89.9,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: Sequelize.literal('gen_random_uuid()'),
        name: 'VR',
        description: 'Bandeira VR',
        price: 89.9,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: Sequelize.literal('gen_random_uuid()'),
        name: 'Ticket',
        description: 'Bandeira Ticket',
        price: 89.9,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: Sequelize.literal('gen_random_uuid()'),
        name: 'Lecard',
        description: 'Bandeira Lecard',
        price: 89.9,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: Sequelize.literal('gen_random_uuid()'),
        name: 'TrioCard',
        description: 'Bandeira TrioCard',
        price: 89.9,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: Sequelize.literal('gen_random_uuid()'),
        name: 'Ben',
        description: 'Bandeira Ben',
        price: 89.9,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('flags', null, {});
  }
};