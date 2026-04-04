const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Sale = sequelize.define(
    'Sale',
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
      plan_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'plans', key: 'id' },
      },
      // Snapshot do plano no momento da venda
      plan_name: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      plan_price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      total_value: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM('pending', 'analysis', 'approved', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending',
      },
      approved_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      sold_by: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
      },
      partner_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
      },
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
      tableName: 'sales',
      timestamps: true,
      paranoid: true,
      underscored: true,
      indexes: [
        { fields: ['client_id'] },
        { fields: ['plan_id'] },
        { fields: ['sold_by'] },
        { fields: ['partner_id'] },
        { fields: ['status'] },
        { fields: ['approved_at'] },
        { fields: ['approved_at', 'partner_id'] },
      ],
    }
  );

  Sale.associate = (db) => {
    Sale.belongsTo(db.Client, { foreignKey: 'client_id', as: 'client' });
    Sale.belongsTo(db.Plan, { foreignKey: 'plan_id', as: 'plan' });
    Sale.belongsTo(db.User, { foreignKey: 'sold_by', as: 'seller' });
    Sale.belongsTo(db.User, { foreignKey: 'partner_id', as: 'partner' });
    Sale.hasMany(db.SaleFlag, { foreignKey: 'sale_id', as: 'saleFlags' });
    Sale.belongsToMany(db.Flag, {
      through: db.SaleFlag,
      foreignKey: 'sale_id',
      as: 'flags',
    });
  };

  return Sale;
};
