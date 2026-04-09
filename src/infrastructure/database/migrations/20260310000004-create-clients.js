'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('clients', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey: true,
        allowNull: false,
      },
      protocol: {
        type: Sequelize.STRING(20),
        allowNull: false,
        unique: true,
      },
      overall_status: {
        type: Sequelize.ENUM('pending', 'analysis', 'approved'),
        allowNull: false,
        defaultValue: 'pending',
      },
      corporate_name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      trade_name: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      responsible_name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      cnpj: {
        type: Sequelize.STRING(18),
        allowNull: false,
      },
      state_registration: {
        type: Sequelize.STRING(15),
        allowNull: true,
      },
      phone: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      benefit_type: {
        type: Sequelize.ENUM('food', 'meal', 'both'),
        allowNull: false,
      },
      machine_name: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      machine_affiliation_code: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      address_street: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      address_number: {
        type: Sequelize.STRING(10),
        allowNull: false,
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
        allowNull: false,
      },
      address_state: {
        type: Sequelize.STRING(2),
        allowNull: false,
      },
      address_zip: {
        type: Sequelize.STRING(9),
        allowNull: false,
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      partner_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      // ✅ NOVO CAMPO ADICIONADO
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Indica se o cliente está ativo para novas operações',
      },
      notes: {
        type: Sequelize.TEXT,
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

    // ÍNDICES (Mantidos conforme seu original)
    await queryInterface.addIndex('clients', ['protocol'], { unique: true, where: { deleted_at: null } });
    await queryInterface.addIndex('clients', ['cnpj'], { unique: true, where: { deleted_at: null } });
    await queryInterface.addIndex('clients', ['email'], { unique: true, where: { deleted_at: null } });
    await queryInterface.addIndex('clients', ['is_active'], { name: 'clients_is_active_idx' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('clients');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_clients_overall_status";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_clients_benefit_type";');
  },
};