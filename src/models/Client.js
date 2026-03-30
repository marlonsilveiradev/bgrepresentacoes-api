const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Client = sequelize.define(
    'Client',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      // Protocolo: YYYYMMDD + sequência (ex: 202603090001)
      protocol: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true,
      },
      // Dados da empresa (pessoa jurídica)
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
        unique: true,
      },
      state_registration: {
        type: DataTypes.STRING(15),
        allowNull: true,
        field: 'state_registration',
        unique: true,
      },
      phone: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: true,
        validate: { isEmail: true },
      },
      address_street: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      address_number: {
        type: DataTypes.STRING(10),
        allowNull: true,
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
        allowNull: true,
      },
      address_state: {
        type: DataTypes.STRING(2),
        allowNull: true,
      },
      address_zip: {
        type: DataTypes.STRING(9),
        allowNull: true,
      },
      // Tipo de benefício do cartão
      benefit_type: {
        type: DataTypes.ENUM('food', 'meal', 'both'),
        allowNull: false,
      },
      // Status calculado automaticamente com base nas bandeiras (sem 'rejected')
      overall_status: {
        type: DataTypes.ENUM('pending', 'analysis', 'approved'),
        defaultValue: 'pending',
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      created_by: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
      },
      partner_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
      },
    },
    {
      tableName: 'clients',
      indexes: [
        { fields: ['created_by'] },
        { fields: ['partner_id'] },
        { fields: ['overall_status'] },
        { fields: ['benefit_type'] },
        { unique: true, fields: ['protocol'] },
        { unique: true, fields: ['cnpj'] },
      ],
    }
  );

  Client.associate = (db) => {
    Client.belongsTo(db.User, { foreignKey: 'created_by', as: 'creator' });
    Client.belongsTo(db.User, { foreignKey: 'partner_id', as: 'partner' });
    Client.hasMany(db.ClientFlag, { foreignKey: 'client_id', as: 'clientFlags' });
    Client.hasMany(db.ClientDocument, { foreignKey: 'client_id', as: 'documents' });
    Client.hasMany(db.ClientBankAccount, { foreignKey: 'client_id', as: 'bankAccounts' });
    Client.hasMany(db.Sale, { foreignKey: 'client_id', as: 'sales' });
  };

  return Client;
};
