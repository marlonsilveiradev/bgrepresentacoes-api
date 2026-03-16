'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('clients', 'state_registration', {
      type: Sequelize.STRING(20),
      allowNull: true, // Como solicitado, não é obrigatório
      after: 'cnpj'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('clients', 'state_registration');
  }
};