'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },

      // Nome (obrigatório)
      name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },

      // Email (único e obrigatório)
      email: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true
      },

      // Senha (obrigatório, hash bcrypt)
      password: {
        type: Sequelize.STRING(255),
        allowNull: false
      },

      // Tipo: 'user', 'admin', 'partner' (padrão: user)
      role: {
        type: Sequelize.ENUM('user', 'admin', 'partner'),
        defaultValue: 'user',
        allowNull: false
      },

      // Se está ativo
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false
      },

      // Quem criou este usuário
      created_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },

      // Último login
      last_login: {
        type: Sequelize.DATE,
        allowNull: true
      },

      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },

      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.addIndex('users', ['email'], { unique: true });
    await queryInterface.addIndex('users', ['role']);
    await queryInterface.addIndex('users', ['is_active']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('users');
  }
};