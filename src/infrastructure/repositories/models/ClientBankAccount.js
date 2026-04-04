const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ClientBankAccount = sequelize.define(
    'ClientBankAccount',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      client_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'clients', key: 'id' },
      },
      bank_code: {
        type: DataTypes.STRING(10),
        allowNull: true,
      },
      bank_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      agency: {
        type: DataTypes.STRING(10),
        allowNull: false,
      },
      agency_digit: {
        type: DataTypes.STRING(2),
        allowNull: true,
      },
      account: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      account_digit: {
        type: DataTypes.STRING(2),
        allowNull: true,
      },
      account_type: {
        type: DataTypes.ENUM('checking', 'savings'),
        allowNull: false,
      },
      deleted_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: 'client_bank_accounts',
      timestamps: true,
      paranoid: true,
      underscored: true,
      indexes: [
        { fields: ['client_id'] },
      ],
    }
  );

  ClientBankAccount.associate = (db) => {
    ClientBankAccount.belongsTo(db.Client, { foreignKey: 'client_id', as: 'client' });
  };

  return ClientBankAccount;
};