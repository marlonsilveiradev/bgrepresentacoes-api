'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('sales', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.literal('gen_random_uuid()'),
                primaryKey: true,
                allowNull: false,
            },
            client_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: { model: 'clients', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT',
            },
            plan_id: {
                type: Sequelize.UUID,
                allowNull: true,
                references: { model: 'plans', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL',
            },
            total_value: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: false,
            },
            approved_at: {
                type: Sequelize.DATE,
                allowNull: true,
            },
            status: {
                type: Sequelize.ENUM(
                    'pending',
                    'analysis',
                    'approved',
                    'cancelled',
                ),
                allowNull: false,
                defaultValue: 'pending'
            },
            plan_name: {
                type: Sequelize.STRING(255),
                allowNull: true
            },

            plan_price: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: true
            },
            sold_by: {
                type: Sequelize.UUID,
                allowNull: false,
                references: { model: 'users', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT',
            },
            partner_id: {
                type: Sequelize.UUID,
                allowNull: true,
                references: { model: 'users', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL',
            },
            notes: {
                type: Sequelize.TEXT,
                allowNull: true,
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

        await queryInterface.addIndex('sales', ['client_id'], { name: 'sales_client_id_idx' });
        await queryInterface.addIndex('sales', ['plan_id'], { name: 'sales_plan_id_idx' });
        await queryInterface.addIndex('sales', ['sold_by'], { name: 'sales_sold_by_idx' });
        await queryInterface.addIndex('sales', ['partner_id'], { name: 'sales_partner_id_idx' });
        await queryInterface.addIndex('sales', ['approved_at'], { name: 'sales_approved_at_idx' });
        await queryInterface.addIndex('sales', ['partner_id', 'status'], { name: 'sales_partner_status_idx' });
        await queryInterface.addIndex('sales', ['approved_at'])
        await queryInterface.addIndex('sales', ['status'], { name: 'sales_status_idx' });
        await queryInterface.addIndex(
            'sales',
            ['client_id', 'status'],
            { name: 'sales_client_status_idx' }
        );
    },

    async down(queryInterface) {
        await queryInterface.dropTable('sales');
    },
};