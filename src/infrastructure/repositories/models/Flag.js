const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Flag = sequelize.define(
    'Flag',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: 'flags',
    }
  );

  Flag.associate = (db) => {
    Flag.hasMany(db.PlanFlag, { foreignKey: 'flag_id', as: 'planFlags' });
    Flag.hasMany(db.ClientFlag, { foreignKey: 'flag_id', as: 'clientFlags' });
    Flag.hasMany(db.SaleFlag, { foreignKey: 'flag_id', as: 'saleFlags' });
    Flag.belongsToMany(db.Plan, {
      through: db.PlanFlag,
      foreignKey: 'flag_id',
      as: 'plans',
    });
    Flag.belongsToMany(db.Sale, {
      through: db.SaleFlag,
      foreignKey: 'flag_id',
      as: 'sales',
    });
  };

  return Flag;
};
