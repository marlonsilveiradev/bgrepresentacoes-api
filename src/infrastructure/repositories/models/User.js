const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const appConfig = require('../../config/config');
const { STRONG_PASSWORD_REGEX, STRONG_PASSWORD_MESSAGE } = require('../../../interfaces/http/validators/authValidators');

module.exports = (sequelize) => {
  const User = sequelize.define(
    'User',
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
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: { isEmail: true },
        // unique: true removido – a unicidade será garantida por índice parcial na migration
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          isStrongPassword(value) {
            if (!value) return;
            if (value.startsWith('$2')) return;
            if (value.length < 8 || !STRONG_PASSWORD_REGEX.test(value)) {
              throw new Error(STRONG_PASSWORD_MESSAGE);
            }
          },
        },
      },
      cpf: {
        type: DataTypes.STRING(14),
        allowNull: true,
        // unique: true removido – índice parcial na migration
      },
      address_street: DataTypes.STRING(255),
      address_number: DataTypes.STRING(10),
      address_complement: DataTypes.STRING(100),
      address_neighborhood: DataTypes.STRING(100),
      address_city: DataTypes.STRING(100),
      address_state: DataTypes.STRING(2),
      address_zip: DataTypes.STRING(9),
      role: {
        type: DataTypes.ENUM('admin', 'user', 'partner'),
        allowNull: false,
        defaultValue: 'user',
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      last_login_at: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'NULL = primeiro login ainda não realizado (deve trocar a senha)',
      },
      deleted_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: 'users',
      timestamps: true,
      paranoid: true,        // ativa soft delete
      underscored: true,
      hooks: {
        beforeCreate: async (user) => {
          user.password = await bcrypt.hash(user.password, appConfig.bcrypt.rounds);
        },
        beforeUpdate: async (user) => {
          if (user.changed('password')) {
            user.password = await bcrypt.hash(user.password, appConfig.bcrypt.rounds);
          }
        },
      },
    }
  );

  User.prototype.checkPassword = function (plainPassword) {
    return bcrypt.compare(plainPassword, this.password);
  };

  User.prototype.toJSON = function () {
    const values = { ...this.get() };
    delete values.password;
    delete values.deleted_at;
    return values;
  };

  User.associate = (db) => {
    User.hasMany(db.Client, { foreignKey: 'created_by', as: 'createdClients' });
    User.hasMany(db.Client, { foreignKey: 'partner_id', as: 'partnerClients' });
  };

  return User;
};