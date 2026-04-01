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
      protocol: {
        type: DataTypes.STRING(20),
        allowNull: false,
        // unique: true removido – índice parcial na migration
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
        // unique: true removido – índice parcial na migration
      },
      state_registration: {
        type: DataTypes.STRING(15),
        allowNull: true,
        field: 'state_registration',
        unique: true, // Mantido porque não há soft delete para este campo (ou pode ser parcial se quiser)
      },
      machine_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'machines', key: 'id' },
      },
      machine_affiliation_code: {
        type: DataTypes.STRING(100),
        allowNull: true,
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
      benefit_type: {
        type: DataTypes.ENUM('food', 'meal', 'both'),
        allowNull: false,
      },
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
      deleted_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: 'clients',
      timestamps: true,
      paranoid: true,        // ativa soft delete
      underscored: true,
      indexes: [
        { fields: ['created_by'] },
        { fields: ['partner_id'] },
        { fields: ['overall_status'] },
        { fields: ['benefit_type'] },
        { fields: ['machine_id'] },
        // protocol e cnpj terão índices únicos parciais na migration (ver abaixo)
      ],
    }
  );

  Client.associate = (db) => {
    Client.belongsTo(db.User, { foreignKey: 'created_by', as: 'creator' });
    Client.belongsTo(db.User, { foreignKey: 'partner_id', as: 'partner' });
    Client.belongsTo(db.Machine, { foreignKey: 'machine_id', as: 'machine' });
    Client.hasMany(db.ClientFlag, { foreignKey: 'client_id', as: 'clientFlags' });
    Client.hasMany(db.ClientDocument, { foreignKey: 'client_id', as: 'documents' });
    Client.hasMany(db.ClientBankAccount, { foreignKey: 'client_id', as: 'bankAccounts' });
    Client.hasMany(db.Sale, { foreignKey: 'client_id', as: 'sales' });
  };

  return Client;
};