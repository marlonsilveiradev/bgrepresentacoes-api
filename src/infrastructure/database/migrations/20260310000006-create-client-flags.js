'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('client_flags', {
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
                type: Sequelize.ENUM('pending', 'analysis', 'approved'),
                allowNull: false,
                defaultValue: 'pending',
            },
            price: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: true
            },

            origin: {
                type: Sequelize.ENUM('plan', 'individual', 'upgrade'),
                allowNull: false,
                defaultValue: 'individual'
            },
            notes: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            analyzed_by: {
                type: Sequelize.UUID,
                allowNull: true,
                references: { model: 'users', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL',
            },
            analyzed_at: {
                type: Sequelize.DATE,
                allowNull: true,
            },
            approved_at: {
                type: Sequelize.DATE,
                allowNull: true,
            },
            rejected_at: {
                type: Sequelize.DATE,
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

        await queryInterface.addIndex('client_flags', ['client_id', 'flag_id'], { unique: true, name: 'client_flags_client_flag_unique' });
        await queryInterface.addIndex('client_flags', ['client_id'], { name: 'client_flags_client_id_idx' });
        await queryInterface.addIndex('client_flags', ['flag_id'], { name: 'client_flags_flag_id_idx' });
        await queryInterface.addIndex('client_flags', ['analyzed_by'], { name: 'client_flags_analyzed_by_idx' });
        await queryInterface.addIndex('client_flags', ['status'], { name: 'client_flags_status_idx' });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('client_flags');
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_client_flags_status";');
    },
};