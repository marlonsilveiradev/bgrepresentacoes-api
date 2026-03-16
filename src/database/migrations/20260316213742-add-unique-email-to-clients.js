'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {

    

    await queryInterface.addConstraint('clients', {
      fields: ['email'],
      type: 'unique',
      name: 'clients_email_unique'
    });

    await queryInterface.addConstraint('clients', {
      fields: ['state_registration'],
      type: 'unique',
      name: 'clients_state_registration_unique'
    });

  },

  async down(queryInterface, Sequelize) {

    await queryInterface.removeConstraint('clients', 'clients_email_unique');
    await queryInterface.removeConstraint('clients', 'clients_state_registration_unique');

    await queryInterface.removeColumn('clients', 'state_registration');

  }
};