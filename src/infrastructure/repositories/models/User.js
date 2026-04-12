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
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING(150),
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: { isEmail: true },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          isStrongPassword(value) {
            if (!value) return;
            if (value.startsWith('$2')) return; // Ignora se já for hash
            if (value.length < 8 || !STRONG_PASSWORD_REGEX.test(value)) {
              throw new Error(STRONG_PASSWORD_MESSAGE);
            }
          },
        },
      },
      cpf: {
        type: DataTypes.STRING(14),
        allowNull: true,
      },
      address_street: { type: DataTypes.STRING(255), allowNull: true },
      address_number: { type: DataTypes.STRING(10), allowNull: true },
      address_complement: { type: DataTypes.STRING(100), allowNull: true },
      address_neighborhood: { type: DataTypes.STRING(100), allowNull: true },
      address_city: { type: DataTypes.STRING(100), allowNull: true },
      address_state: { type: DataTypes.STRING(2), allowNull: true },
      address_zip: { type: DataTypes.STRING(9), allowNull: true },
      
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
      },
      must_change_password: { 
        type: DataTypes.BOOLEAN, 
        defaultValue: true 
      },
      deleted_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: 'users',
      timestamps: true,
      paranoid: true,
      underscored: true,
      hooks: {
        beforeCreate: async (user) => {
          if (user.password) {
            user.password = await bcrypt.hash(user.password, appConfig.bcrypt.rounds);
          }
        },
        beforeUpdate: async (user) => {
          if (user.changed('password')) {
            user.password = await bcrypt.hash(user.password, appConfig.bcrypt.rounds);
            // ✅ Se a senha mudou (reset pelo admin), obriga a troca no próximo login
            user.must_change_password = true;
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