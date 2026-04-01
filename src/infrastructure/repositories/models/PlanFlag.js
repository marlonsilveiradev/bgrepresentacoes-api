const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const PlanFlag = sequelize.define(
    'PlanFlag',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      plan_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'plans', key: 'id' },
      },
      flag_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'flags', key: 'id' },
      },
    },
    {
      tableName: 'plan_flags',
      indexes: [{ unique: true, fields: ['plan_id', 'flag_id'] }],
    }
  );

  PlanFlag.associate = (db) => {
    PlanFlag.belongsTo(db.Plan, { foreignKey: 'plan_id', as: 'plan' });
    PlanFlag.belongsTo(db.Flag, { foreignKey: 'flag_id', as: 'flag' });
  };

  return PlanFlag;
};
