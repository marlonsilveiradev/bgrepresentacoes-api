'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('plan_flags', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey: true,
        allowNull: false,
      },
      plan_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'plans', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      flag_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'flags', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });

    await queryInterface.addIndex('plan_flags', ['plan_id', 'flag_id'], { unique: true, name: 'plan_flags_plan_flag_unique' });
    await queryInterface.addIndex('plan_flags', ['plan_id'], { name: 'plan_flags_plan_id_idx' });
    await queryInterface.addIndex('plan_flags', ['flag_id'], { name: 'plan_flags_flag_id_idx' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('plan_flags');
  },
};