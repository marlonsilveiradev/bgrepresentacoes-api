'use strict';

/** @type {import('sequelize-cli').Migration} */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('clients', {
      // ─── ID ──────────────────────────────────────────────────
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey: true,
        allowNull: false,
      },

      // ─── PROTOCOLO E STATUS ──────────────────────────────────
      protocol: {
        type: Sequelize.STRING(20),
        allowNull: false,
        unique: true,
        comment: 'Número único de protocolo do onboarding',
      },

      overall_status: {
        type: Sequelize.ENUM('pending', 'analysis', 'approved'),
        allowNull: false,
        defaultValue: 'pending',
        comment: 'Status geral do cliente (pending, analysis, approved)',
      },

      // ─── DADOS BÁSICOS ───────────────────────────────────────
      corporate_name: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Razão social da empresa',
      },

      trade_name: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'Nome fantasia da empresa',
      },

      responsible_name: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Nome do responsável legal',
      },

      cnpj: {
        type: Sequelize.STRING(18),
        allowNull: false,
        comment: 'CNPJ com máscara (XX.XXX.XXX/XXXX-XX)',
      },

      state_registration: {
        type: Sequelize.STRING(15),
        allowNull: true,
        comment: 'Inscrição estadual',
      },

      phone: {
        type: Sequelize.STRING(20),
        allowNull: false,
        comment: 'Telefone do cliente',
      },

      email: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Email do cliente',
      },

      benefit_type: {
        type: Sequelize.ENUM('food', 'meal', 'both'),
        allowNull: false,
        comment: 'Tipo de benefício: food, meal, ou both',
      },

      // ─── MÁQUINA ──────────────────────────────────────────────
      
      machine_name: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'Nome da máquina (ex: Máquina A, Terminal 01)',
      },

      machine_affiliation_code: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'Código de filiação/afiliação da máquina',
      },

      // ─── ENDEREÇO ────────────────────────────────────────────
      address_street: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Rua/avenida do endereço',
      },

      address_number: {
        type: Sequelize.STRING(10),
        allowNull: false,
        comment: 'Número do imóvel',
      },

      address_complement: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'Complemento (apto, sala, etc)',
      },

      address_neighborhood: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'Bairro',
      },

      address_city: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: 'Cidade',
      },

      address_state: {
        type: Sequelize.STRING(2),
        allowNull: false,
        comment: 'UF (XX)',
      },

      address_zip: {
        type: Sequelize.STRING(9),
        allowNull: false,
        comment: 'CEP (XXXXX-XXX ou XXXXXXXXX)',
      },

      // ─── RELACIONAMENTOS ────────────────────────────────────
      created_by: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
        comment: 'Usuário que criou o cliente',
      },

      partner_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'Parceiro responsável pelo cliente',
      },

      // ─── DADOS ADICIONAIS ───────────────────────────────────
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Notas e observações sobre o cliente',
      },

      // ─── TIMESTAMPS E SOFT DELETE ────────────────────────────
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
        comment: 'Data de soft delete',
      },
    });

    // ─── ÍNDICES ÚNICOS PARCIAIS ────────────────────────────────
    // Apenas registros NÃO deletados
    await queryInterface.addIndex('clients', ['protocol'], {
      unique: true,
      name: 'clients_protocol_unique_active',
      where: { deleted_at: null },
    });

    await queryInterface.addIndex('clients', ['cnpj'], {
      unique: true,
      name: 'clients_cnpj_unique_active',
      where: { deleted_at: null },
    });

    await queryInterface.addIndex('clients', ['email'], {
      unique: true,
      name: 'clients_email_unique_active',
      where: { deleted_at: null },
    });

    // ─── ÍNDICES COMUNS ─────────────────────────────────────────
    await queryInterface.addIndex('clients', ['created_by'], {
      name: 'clients_created_by_idx',
    });

    await queryInterface.addIndex('clients', ['partner_id'], {
      name: 'clients_partner_id_idx',
    });

    await queryInterface.addIndex('clients', ['overall_status'], {
      name: 'clients_overall_status_idx',
    });

    await queryInterface.addIndex('clients', ['corporate_name'], {
      name: 'clients_corporate_name_idx',
    });

    // ─── ÍNDICES COMPOSTOS (QUERIES COMUNS) ──────────────────────
    await queryInterface.addIndex(
      'clients',
      ['partner_id', 'overall_status'],
      {
        name: 'clients_partner_status_idx',
      }
    );

    await queryInterface.addIndex('clients', ['benefit_type'], {
      name: 'clients_benefit_type_idx',
    });

    await queryInterface.addIndex('clients', ['created_by', 'overall_status'], {
      name: 'clients_creator_status_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('clients');

    // ✅ Limpar ENUMs criados
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_clients_overall_status";'
    );

    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_clients_benefit_type";'
    );
  },
};