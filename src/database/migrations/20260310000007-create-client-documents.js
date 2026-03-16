'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('client_documents', {
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
            // Apenas public_id do Cloudinary — nunca salvar URL direta
            cloudinary_public_id: {
                type: Sequelize.STRING(500),
                allowNull: false,
            },
            document_type: {
                type: Sequelize.ENUM('company_document', 'proof_of_address', 'bank_account_proof', 'card_machine_proof'),
                allowNull: false,
            },
            original_name: {
                type: Sequelize.STRING(255),
                allowNull: true,
            },
            mime_type: {
                type: Sequelize.STRING(100),
                allowNull: true,
            },
            file_size: {
                type: Sequelize.INTEGER,
                allowNull: true,
            },
            uploaded_by: {
                type: Sequelize.UUID,
                allowNull: false,
                references: { model: 'users', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT',
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

        await queryInterface.addIndex('client_documents', ['client_id'], { name: 'client_documents_client_id_idx' });
        await queryInterface.addIndex('client_documents', ['uploaded_by'], { name: 'client_documents_uploaded_by_idx' });
        await queryInterface.addIndex('client_documents', ['document_type'], { name: 'client_documents_document_type_idx' });
        await queryInterface.addConstraint('client_documents', { fields: ['client_id', 'document_type'], type: 'unique', name: 'unique_client_document_type' },
        );
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('client_documents');
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_client_documents_document_type";');
    },
};