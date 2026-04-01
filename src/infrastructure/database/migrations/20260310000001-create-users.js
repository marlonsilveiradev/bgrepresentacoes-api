'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto";');

    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey: true,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING(150),
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      role: {
        type: Sequelize.ENUM('admin', 'user', 'partner'),
        allowNull: false,
        defaultValue: 'user',
      },
      cpf: {
        type: Sequelize.STRING(14),
        allowNull: true,
      },
      address_street: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      address_number: {
        type: Sequelize.STRING(10),
        allowNull: true,
      },
      address_complement: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      address_neighborhood: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      address_city: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      address_state: {
        type: Sequelize.STRING(2),
        allowNull: true,
      },
      address_zip: {
        type: Sequelize.STRING(9),
        allowNull: true,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      last_login_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });

    await queryInterface.addIndex('users', ['cpf'], { unique: true, name: 'users_cpf_unique', where: { deleted_at: null } });
    await queryInterface.addIndex('users', ['email'], { unique: true, name: 'users_email_unique', where: { deleted_at: null } });
    await queryInterface.addIndex('users', ['role'], { name: 'users_role_idx' });
    await queryInterface.addIndex('users', ['is_active'], { name: 'users_is_active_idx' });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('users');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_users_role";');
  },
};