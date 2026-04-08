const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Client extends Model {}

  Client.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },

      // ─── PROTOCOLO E STATUS ──────────────────────────────────
      protocol: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true,
        validate: {
          notEmpty: true,
          len: [1, 20],
        },
      },

      overall_status: {
        type: DataTypes.ENUM('pending', 'analysis', 'approved'),
        allowNull: false,
        defaultValue: 'pending',
        validate: {
          isIn: [['pending', 'analysis', 'approved']],
        },
      },

      // ─── DADOS BÁSICOS ───────────────────────────────────────
      corporate_name: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [3, 255],
        },
      },

      trade_name: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },

      responsible_name: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [3, 255],
        },
      },

      cnpj: {
        type: DataTypes.STRING(18),
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [18, 18], // XX.XXX.XXX/XXXX-XX
        },
      },

      state_registration: {
        type: DataTypes.STRING(15),
        allowNull: true,
      },

      phone: {
        type: DataTypes.STRING(20),
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },

      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },

      benefit_type: {
        type: DataTypes.ENUM('food', 'meal', 'both'),
        allowNull: false,
        validate: {
          isIn: [['food', 'meal', 'both']],
        },
      },

      // ─── MÁQUINA (AGORA APENAS CAMPOS) ──────────────────────
      // ✅ REMOVIDO: machine_id (FK)
      // ✅ NOVO: machine_name e machine_affiliation_code
      machine_name: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },

      machine_affiliation_code: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },

      // ─── ENDEREÇO ────────────────────────────────────────────
      address_street: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },

      address_number: {
        type: DataTypes.STRING(10),
        allowNull: false,
        validate: {
          notEmpty: true,
        },
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
        validate: {
          notEmpty: true,
        },
      },

      address_state: {
        type: DataTypes.STRING(2),
        allowNull: false,
        validate: {
          len: [2, 2],
          isUppercase: true,
        },
      },

      address_zip: {
        type: DataTypes.STRING(9),
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },

      // ─── RELACIONAMENTOS ────────────────────────────────────
      created_by: {
        type: DataTypes.UUID,
        allowNull: false,
      },

      partner_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },

      // ─── DADOS ADICIONAIS ───────────────────────────────────
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      deleted_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'Client',
      tableName: 'clients',
      timestamps: true,
      paranoid: true, // ✅ Soft delete automático
      underscored: true,
    }
  );

  // ✅ Métodos de instância
  Client.prototype.toJSON = function () {
    const values = { ...this.get() };
    delete values.deleted_at;
    return values;
  };

  // ✅ Método para gerar protocolo único
  Client.prototype.generateProtocol = function () {
    // Formato: CLI-YYYYMMDD-XXXXXX (ex: CLI-20260408-A1B2C3)
    const date = new Date();
    const dateStr = date
      .toISOString()
      .split('T')[0]
      .replace(/-/g, '');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.protocol = `CLI-${dateStr}-${random}`;
  };

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