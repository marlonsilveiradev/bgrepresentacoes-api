const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Machine = sequelize.define('Machine', {
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
    code: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  }, {
    tableName: 'machines',
    timestamps: true,
    underscored: true,
  });

  Machine.associate = (db) => {
    Machine.hasMany(db.Client, { foreignKey: 'machine_id', as: 'clients' });
  };

  return Machine;
};