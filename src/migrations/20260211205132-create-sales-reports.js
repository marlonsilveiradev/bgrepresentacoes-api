'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('sales_reports', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },

      // Relacionamento com cliente
      client_id: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true,
        references: {
          model: 'clients',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },

      // ═════════════════════════════════════════════════════════
      // DADOS DA VENDA
      // ═════════════════════════════════════════════════════════

      sale_date: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },

      sale_day: {
        type: Sequelize.INTEGER, // 1-31
        allowNull: false
      },

      sale_month: {
        type: Sequelize.INTEGER, // 1-12
        allowNull: false
      },

      sale_year: {
        type: Sequelize.INTEGER, // 2024, 2025...
        allowNull: false
      },

      // ═════════════════════════════════════════════════════════
      // SNAPSHOT DO PLANO
      // ═════════════════════════════════════════════════════════

      plan_name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },

      plan_code: {
        type: Sequelize.STRING(50),
        allowNull: false
      },

      plan_price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },

      // ═════════════════════════════════════════════════════════
      // VALORES
      // ═════════════════════════════════════════════════════════

      total_value: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },

      // ═════════════════════════════════════════════════════════
      // QUEM VENDEU
      // ═════════════════════════════════════════════════════════

      sold_by: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },

      sold_by_name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },

      sold_by_role: {
        type: Sequelize.ENUM('user', 'admin'),
        allowNull: false
      },

      // ═════════════════════════════════════════════════════════
      // PARCEIRO ASSOCIADO
      // ═════════════════════════════════════════════════════════

      partner_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },

      partner_name: {
        type: Sequelize.STRING(255),
        allowNull: true
      },

      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },

      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Índices para relatórios rápidos
    await queryInterface.addIndex('sales_reports', ['sale_date']);
    await queryInterface.addIndex('sales_reports', ['sale_day', 'sale_month', 'sale_year']);
    await queryInterface.addIndex('sales_reports', ['sale_month', 'sale_year']);
    await queryInterface.addIndex('sales_reports', ['sale_year']);
    await queryInterface.addIndex('sales_reports', ['sold_by']);
    await queryInterface.addIndex('sales_reports', ['partner_id']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('sales_reports');
  }
};