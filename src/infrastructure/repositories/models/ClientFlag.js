const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ClientFlag = sequelize.define(
    'ClientFlag',
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
      flag_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'flags', key: 'id' },
      },
      // Status independente por bandeira por cliente (sem 'rejected')
      status: {
        type: DataTypes.ENUM('pending', 'analysis', 'approved'),
        allowNull: false,
        defaultValue: 'pending',
      },
      // Preço aplicado a esta bandeira para este cliente
      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      // Origem: via plano, individual ou upgrade
      origin: {
        type: DataTypes.ENUM('plan', 'individual', 'upgrade'),
        allowNull: false,
        defaultValue: 'plan',
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      analyzed_by: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
      },
      analyzed_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      approved_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: 'client_flags',
      indexes: [
        { unique: true, fields: ['client_id', 'flag_id'] },
        { fields: ['client_id'] },
        { fields: ['flag_id'] },
        { fields: ['analyzed_by'] },
        { fields: ['status'] },
        { fields: ['origin'] },
      ],
    }
  );

  ClientFlag.associate = (db) => {
    ClientFlag.belongsTo(db.Client, { foreignKey: 'client_id', as: 'client' });
    ClientFlag.belongsTo(db.Flag, { foreignKey: 'flag_id', as: 'flag' });
    ClientFlag.belongsTo(db.User, { foreignKey: 'analyzed_by', as: 'analyst' });
  };

  return ClientFlag;
};
