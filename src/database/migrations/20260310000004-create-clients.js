'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('clients', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.literal('gen_random_uuid()'),
                primaryKey: true,
                allowNull: false,
            },
            protocol: {
                type: Sequelize.STRING(20),
                allowNull: false,
                unique: true,
            },
            corporate_name: {
                type: Sequelize.STRING(255),
                allowNull: false,
            },
            trade_name: {
                type: Sequelize.STRING(255),
                allowNull: true,
            },
            responsible_name: {
                type: Sequelize.STRING(255),
                allowNull: false, 
            },
            cnpj: {
                type: Sequelize.STRING(18),
                allowNull: false,
                unique: true,
            },
            phone: {
                type: Sequelize.STRING(20),
                allowNull: true,
            },
            email: {
                type: Sequelize.STRING(255),
                allowNull: true,
            },
            address_street: {
                type: Sequelize.STRING(255),
                allowNull: true,
            },
            address_number: {
                type: Sequelize.STRING(10),
                allowNull: true,
            },
            address_complement: {
                type: Sequelize.STRING(100),
                allowNull: true,
            },
            address_neighborhood: {
                type: Sequelize.STRING(100),
                allowNull: true,
            },
            address_city: {
                type: Sequelize.STRING(100),
                allowNull: true,
            },
            address_state: {
                type: Sequelize.STRING(2),
                allowNull: true,
            },
            address_zip: {
                type: Sequelize.STRING(9),
                allowNull: true,
            },
            overall_status: {
                type: Sequelize.ENUM('pending', 'analysis', 'approved'),
                allowNull: false,
                defaultValue: 'pending',
            },
            notes: {
                type: Sequelize.TEXT,
                allowNull: true,
            },
            created_by: {
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
            benefit_type: {
                type: Sequelize.ENUM(
                    'food',
                    'meal',
                    'both'
                ),
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
            deleted_at: {
                type: Sequelize.DATE,
                allowNull: true,
            },
        });

        await queryInterface.addIndex('clients', ['protocol'], { unique: true, name: 'clients_protocol_unique' });
        await queryInterface.addIndex('clients', ['created_by'], { name: 'clients_created_by_idx' });
        await queryInterface.addIndex('clients', ['partner_id'], { name: 'clients_partner_id_idx' });
        await queryInterface.addIndex('clients', ['overall_status'], { name: 'clients_overall_status_idx' });
        await queryInterface.addIndex('clients', ['cnpj'], { unique: true, name: 'clients_cnpj_unique' });
        await queryInterface.addIndex('clients', ['corporate_name'], { name: 'clients_corporate_name_idx' });
        await queryInterface.addIndex('clients', ['partner_id', 'overall_status'], { name: 'clients_partner_status_idx' });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('clients');
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_clients_overall_status";');
    },
};