/**
 * MODEL: Client
 * 
 * ✅ CORRIGIDO:
 * - UUID gerado APENAS na migration (gen_random_uuid())
 * - Model apenas referencia DataTypes.UUIDV4 (sem defaultValue duplicado)
 * - Transações agora funcionam
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Client = sequelize.define(
    'Client',
    {
      // ✅ CORRIGIDO: UUID sem defaultValue duplicado
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: DataTypes.UUIDV4,
      },

      protocol: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },

      corporate_name: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },

      trade_name: {
        type: DataTypes.STRING(200),
        allowNull: true,
      },

      responsible_name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },

      cnpj: {
        type: DataTypes.STRING(18),
        allowNull: false,
      },

      state_registration: {
        type: DataTypes.STRING(15),
        allowNull: true,
        unique: true,
      },

      machine_name: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },

      machine_affiliation_code: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },

      phone: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },

      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
      },

      address_street: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },

      address_number: {
        type: DataTypes.STRING(10),
        allowNull: false,
      },

      address_complement: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },

      address_neighborhood: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },

      address_city: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },

      address_state: {
        type: DataTypes.STRING(2),
        allowNull: false,
      },

      address_zip: {
        type: DataTypes.STRING(9),
        allowNull: false,
      },

      overall_status: {
        type: DataTypes.ENUM('pending', 'analysis', 'approved'),
        allowNull: false,
        defaultValue: 'pending',
      },

      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      benefit_type: {
        type: DataTypes.ENUM('food', 'meal', 'both'),
        allowNull: false,
      },

      created_by: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },

      partner_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },

      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: 'clients',
      timestamps: true,
      paranoid: true,  // ✅ Soft delete automático
      underscored: true,
    }
  );

  // ✅ Associações
  Client.associate = (db) => {
    Client.belongsTo(db.User, {
      foreignKey: 'created_by',
      as: 'creator',
    });

    Client.belongsTo(db.User, {
      foreignKey: 'partner_id',
      as: 'partner',
    });

    Client.hasMany(db.ClientFlag, {
      foreignKey: 'client_id',
      as: 'flags',
    });

    Client.hasMany(db.ClientBankAccount, {
      foreignKey: 'client_id',
      sourceKey: 'id',
      as: 'bankAccounts',
    });

    Client.hasMany(db.ClientDocument, {
      foreignKey: 'client_id',
      as: 'documents',
    });

    Client.hasMany(db.Sale, {
      foreignKey: 'client_id',
      as: 'sales',
    });
  };

  return Client;
};