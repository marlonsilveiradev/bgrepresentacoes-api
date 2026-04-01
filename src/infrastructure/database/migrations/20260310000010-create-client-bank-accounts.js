'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {

    await queryInterface.createTable('client_bank_accounts', {

      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey: true,
        allowNull: false
      },

      client_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'clients',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },

      bank_code: {
        type: Sequelize.STRING(10),
        allowNull: true
      },

      bank_name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },

      agency: {
        type: Sequelize.STRING(10),
        allowNull: false
      },

      agency_digit: {
        type: Sequelize.STRING(2),
        allowNull: true
      },

      account: {
        type: Sequelize.STRING(20),
        allowNull: false
      },

      account_digit: {
        type: Sequelize.STRING(2),
        allowNull: true
      },

      account_type: {
        type: Sequelize.ENUM('checking', 'savings'),
        allowNull: false
      },

      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()')
      },

      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()')
      }

    });

    await queryInterface.addIndex(
      'client_bank_accounts',
      ['client_id'],
      { name: 'client_bank_accounts_client_idx' }
    );

  },

  async down(queryInterface, Sequelize) {

    await queryInterface.dropTable('client_bank_accounts');

    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_client_bank_accounts_account_type";'
    );

  }
};