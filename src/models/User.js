const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const appConfig = require('../config/config');
const { STRONG_PASSWORD_REGEX, STRONG_PASSWORD_MESSAGE } = require('../validators/authValidators');

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
        unique: true,
        validate: { isEmail: true },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          // Validação aplicada ANTES do hash (apenas no valor em plain text)
          isStrongPassword(value) {
            // 1. Se não houver valor (não está sendo alterado), permite passar
            if (!value) return;

            // 2. Se já for um hash, permite passar
            if (value.startsWith('$2')) return;

            // 3. Se houver valor e não for hash, valida a força
            if (value.length < 8 || !STRONG_PASSWORD_REGEX.test(value)) {
              throw new Error(STRONG_PASSWORD_MESSAGE);
            }
          },
        },
      },
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
    },
    {
      tableName: 'users',
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

  /**
   * Compara uma senha em texto plano com o hash armazenado.
   * @param {string} plainPassword
   * @returns {Promise<boolean>}
   */
  User.prototype.checkPassword = function (plainPassword) {
    return bcrypt.compare(plainPassword, this.password);
  };

  /**
   * Remove campos sensíveis da serialização JSON.
   */
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
