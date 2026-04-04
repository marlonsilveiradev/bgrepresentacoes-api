const { DataTypes } = require('sequelize');
const { Sequelize } = require('.');

module.exports = (sequelize) => {
  const ClientDocument = sequelize.define(
    'ClientDocument',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      client_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'clients', key: 'id' },
      },
      // Apenas o public_id do Cloudinary — nunca salvar URL direta
      cloudinary_public_id: {
        type: DataTypes.STRING(500),
        allowNull: false,
      },
      document_type: {
        type: DataTypes.ENUM(
          'company_document',
          'proof_of_address',
          'bank_account_proof',
          'card_machine_proof'
        ),
        allowNull: false,
      },
      original_name: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      mime_type: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      file_size: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      uploaded_by: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    },
    {
      tableName: 'client_documents',      
      timestamps: true,
      paranoid: true,
      underscored: true,
      indexes: [
        { fields: ['client_id'] },
        { fields: ['uploaded_by'] },
        { fields: ['document_type'] },
      ],
    }
  );

  ClientDocument.associate = (db) => {
    ClientDocument.belongsTo(db.Client, { foreignKey: 'client_id', as: 'client' });
    ClientDocument.belongsTo(db.User, { foreignKey: 'uploaded_by', as: 'uploader' });
  };

  return ClientDocument;
};
