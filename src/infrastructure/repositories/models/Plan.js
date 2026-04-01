const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Plan = sequelize.define(
    'Plan',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(150),
        allowNull: false,
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
      tableName: 'plans',
    }
  );

  Plan.associate = (db) => {
    Plan.hasMany(db.PlanFlag, { foreignKey: 'plan_id', as: 'planFlags' });
    Plan.belongsToMany(db.Flag, {
      through: db.PlanFlag,
      foreignKey: 'plan_id',
      as: 'flags',
    });
    Plan.hasMany(db.Sale, { foreignKey: 'plan_id', as: 'sales' });
  };

  return Plan;
};
