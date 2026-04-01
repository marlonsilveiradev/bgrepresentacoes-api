const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const SaleFlag = sequelize.define(
    'SaleFlag',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      sale_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'sales', key: 'id' },
      },
      flag_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'flags', key: 'id' },
      },
      status: {
        type: DataTypes.ENUM('pending', 'analysis', 'approved'),
        allowNull: false,
        defaultValue: 'pending',
      },
      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
    },
    {
      tableName: 'sale_flags',
      underscored: true,
      paranoid: false,
      indexes: [
        { unique: true, fields: ['sale_id', 'flag_id'] },
        { fields: ['sale_id'] },
        { fields: ['flag_id'] },
        { fields: ['status'] },
      ],
    }
  );

  SaleFlag.associate = (db) => {
    SaleFlag.belongsTo(db.Sale, { foreignKey: 'sale_id', as: 'sale' });
    SaleFlag.belongsTo(db.Flag, { foreignKey: 'flag_id', as: 'flag' });
  };

  return SaleFlag;
};
