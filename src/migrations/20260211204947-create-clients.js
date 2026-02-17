'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('clients', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },

      // ═════════════════════════════════════════════════════════
      // DADOS BÁSICOS
      // ═════════════════════════════════════════════════════════

      name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },

      razao_social: {
        type: Sequelize.STRING(255),
        allowNull: false
      },

      ramo_atividade: {
        type: Sequelize.STRING(255),
        allowNull: true
      },

      tipo_cartao: {
        type: Sequelize.ENUM('alimentacao', 'refeicao', 'ambos'),
        allowNull: false
      },

      // ═════════════════════════════════════════════════════════
      // ENDEREÇO
      // ═════════════════════════════════════════════════════════

      rua: {
        type: Sequelize.STRING(255),
        allowNull: false
      },

      numero: {
        type: Sequelize.STRING(20),
        allowNull: false
      },

      complemento: {
        type: Sequelize.STRING(100),
        allowNull: true
      },

      bairro: {
        type: Sequelize.STRING(100),
        allowNull: false
      },

      cidade: {
        type: Sequelize.STRING(100),
        allowNull: false
      },

      estado: {
        type: Sequelize.STRING(2),
        allowNull: false
      },

      cep: {
        type: Sequelize.STRING(8),
        allowNull: false
      },

      // ═════════════════════════════════════════════════════════
      // DOCUMENTOS
      // ═════════════════════════════════════════════════════════

      cnpj: {
        type: Sequelize.STRING(14),
        allowNull: false,
        unique: true
      },

      inscricao_estadual: {
        type: Sequelize.STRING(20),
        allowNull: true
      },

      // ═════════════════════════════════════════════════════════
      // CONTATO
      // ═════════════════════════════════════════════════════════

      email: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true
      },

      telefone: {
        type: Sequelize.STRING(11),
        allowNull: false
      },

      // ═════════════════════════════════════════════════════════
      // DADOS BANCÁRIOS
      // ═════════════════════════════════════════════════════════

      banco: {
        type: Sequelize.STRING(100),
        allowNull: true
      },

      agencia: {
        type: Sequelize.STRING(10),
        allowNull: true
      },

      conta: {
        type: Sequelize.STRING(20),
        allowNull: true
      },

      digito: {
        type: Sequelize.STRING(2),
        allowNull: true
      },

      // ═════════════════════════════════════════════════════════
      // PROTOCOLO E PLANO
      // ═════════════════════════════════════════════════════════

      protocol: {
        type: Sequelize.STRING(15),
        allowNull: false,
        unique: true
      },

      plan_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'plans',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },

      total_value: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },

      // ═════════════════════════════════════════════════════════
      // DOCUMENTOS ANEXADOS
      // ═════════════════════════════════════════════════════════

      document_url: {
        type: Sequelize.STRING(500),
        allowNull: false
      },

      invoice_url: {
        type: Sequelize.STRING(500),
        allowNull: false
      },

      energy_bill_url: {
        type: Sequelize.STRING(500),
        allowNull: false
      },

      // ═════════════════════════════════════════════════════════
      // STATUS E OBSERVAÇÕES
      // ═════════════════════════════════════════════════════════

      // Status geral (calculado com base nas bandeiras)
      status: {
        type: Sequelize.ENUM('pending', 'in_analysis', 'approved'),
        defaultValue: 'pending',
        allowNull: false
      },

      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },

      // ═════════════════════════════════════════════════════════
      // RELACIONAMENTOS
      // ═════════════════════════════════════════════════════════

      created_by: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },

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

    await queryInterface.addIndex('clients', ['cnpj'], { unique: true });
    await queryInterface.addIndex('clients', ['email'], { unique: true });
    await queryInterface.addIndex('clients', ['protocol'], { unique: true });
    await queryInterface.addIndex('clients', ['status']);
    await queryInterface.addIndex('clients', ['created_by']);
    await queryInterface.addIndex('clients', ['partner_id']);
    await queryInterface.addIndex('clients', ['plan_id']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('clients');
  }
};