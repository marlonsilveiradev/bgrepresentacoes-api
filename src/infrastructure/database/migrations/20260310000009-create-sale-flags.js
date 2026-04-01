'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('sale_flags', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.literal('gen_random_uuid()'),
                primaryKey: true,
                allowNull: false,
            },
            sale_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: { model: 'sales', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
            },
            flag_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: { model: 'flags', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT',
            },
            status: {
                type: Sequelize.ENUM(
                    'pending',
                    'analysis',
                    'approved'
                ),
                allowNull: false,
                defaultValue: 'pending'
            },
            price: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: false
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
        });

        await queryInterface.addIndex('sale_flags', ['sale_id', 'flag_id'], { unique: true, name: 'sale_flags_sale_flag_unique' });
        await queryInterface.addIndex('sale_flags', ['sale_id'], { name: 'sale_flags_sale_id_idx' });
        await queryInterface.addIndex('sale_flags', ['flag_id'], { name: 'sale_flags_flag_id_idx' });
    },

    async down(queryInterface) {
        await queryInterface.dropTable('sale_flags');
    },
};