'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('client_flags', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },

      // ═════════════════════════════════════════════════════════
      // RELACIONAMENTOS
      // ═════════════════════════════════════════════════════════

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

      flag_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'flags',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },

      // ═════════════════════════════════════════════════════════
      // SNAPSHOT DO PREÇO NO MOMENTO DA CONTRATAÇÃO
      // ═════════════════════════════════════════════════════════

      flag_name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },

      flag_price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },

      // ═════════════════════════════════════════════════════════
      // STATUS INDIVIDUAL DA BANDEIRA
      // ═════════════════════════════════════════════════════════

      status: {
        type: Sequelize.ENUM('pending', 'in_analysis', 'approved'),
        defaultValue: 'pending',
        allowNull: false
      },

      // ═════════════════════════════════════════════════════════
      // AUDITORIA
      // ═════════════════════════════════════════════════════════

      // Quando o status foi alterado pela última vez
      status_updated_at: {
        type: Sequelize.DATE,
        allowNull: true
      },

      // Quem alterou o status pela última vez
      status_updated_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
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

    // Índices
    await queryInterface.addIndex('client_flags', ['client_id']);
    await queryInterface.addIndex('client_flags', ['flag_id']);
    await queryInterface.addIndex('client_flags', ['status']);

    // Garante que não haja bandeira duplicada para o mesmo cliente
    await queryInterface.addIndex('client_flags', ['client_id', 'flag_id'], {
      unique: true,
      name: 'client_flags_unique'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('client_flags');
  }
};