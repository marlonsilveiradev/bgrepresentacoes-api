'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Definimos apenas os nomes (o que realmente muda)
    const flagNames = ['Alelo', 'Pluxee', 'VR', 'Ticket', 'Lecard', 'TrioCard', 'PersonalCard'];

    // 2. Criamos o array de objetos dinamicamente
    const flags = flagNames.map(name => ({
      id: Sequelize.literal('gen_random_uuid()'),
      name: name,
      description: `Bandeira ${name}`,
      price: 89.9,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    }));

    // 3. Realizamos um único insert
    await queryInterface.bulkInsert('flags', flags, {});
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('flags', null, {});
  }
};