'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('flags', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },

      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true
      },

      code: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
      },

      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },

      // Preço individual (editável pelo admin)
      price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },

      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false
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

    await queryInterface.addIndex('flags', ['code'], { unique: true });
    await queryInterface.addIndex('flags', ['is_active']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('flags');
  }
};