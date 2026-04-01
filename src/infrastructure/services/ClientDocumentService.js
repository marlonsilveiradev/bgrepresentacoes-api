const { ClientDocument } = require('../repositories/models');
const StorageService = require('./StorageService');

const FIELD_MAP = {
  contrato: 'company_document',
  proof_of_address: 'proof_of_address',
  bank_account_proof: 'bank_account_proof',
  card_machine_proof: 'card_machine_proof',
};

const cleanupDocuments = async ({ uploadedPublicIds = [], oldPublicIdsToDelete = [] }) => {
  // Remove antigos (pós sucesso)
  for (const oldId of oldPublicIdsToDelete) {
    StorageService.deleteFromCloudinary(oldId)
      .catch(e => console.error(`Erro ao remover imagem antiga: ${e}`));
  }

  // Remove novos (rollback)
  for (const newId of uploadedPublicIds) {
    StorageService.deleteFromCloudinary(newId)
      .catch(e => console.error(`Erro ao limpar upload falho: ${e}`));
  }
};

const handleClientDocuments = async ({
  clientId,
  files,
  requesterId,
  transaction,
}) => {
  const uploadedPublicIds = [];
  const oldPublicIdsToDelete = [];

  for (const [fieldName, docType] of Object.entries(FIELD_MAP)) {
    if (files[fieldName]?.[0]) {
      const file = files[fieldName][0];

      const upload = await StorageService.uploadToCloudinary(
        file.buffer,
        `client_${clientId}_${docType}`
      );

      uploadedPublicIds.push(upload.public_id);

      const existingDoc = await ClientDocument.findOne({
        where: { client_id: clientId, document_type: docType },
        transaction,
      });

      if (existingDoc) {
        if (existingDoc.cloudinary_public_id !== upload.public_id) {
          oldPublicIdsToDelete.push(existingDoc.cloudinary_public_id);
        }

        await existingDoc.update({
          cloudinary_public_id: upload.public_id,
          original_name: file.originalname,
          mime_type: file.mimetype,
          file_size: file.size,
          uploaded_by: requesterId,
        }, { transaction });
      } else {
        await ClientDocument.create({
          client_id: clientId,
          document_type: docType,
          cloudinary_public_id: upload.public_id,
          original_name: file.originalname,
          mime_type: file.mimetype,
          file_size: file.size,
          uploaded_by: requesterId,
        }, { transaction });
      }
    }
  }

  return { uploadedPublicIds, oldPublicIdsToDelete };
};

module.exports = { handleClientDocuments, cleanupDocuments };