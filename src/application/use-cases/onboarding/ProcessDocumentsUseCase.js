/**
 * USE CASE: Processar Documentos
 * Faz upload de documentos para Cloudinary
 */

const { ClientDocument } = require('../../../infrastructure/repositories/models');
const StorageService = require('../../../infrastructure/services/StorageService');
const AppError = require('../../../shared/utils/AppError');

class ProcessDocumentsUseCase {
  // Mapeamento de campo → tipo de documento
  FIELD_MAP = {
    contrato: 'contrato',
    documentos: 'documentos',
  };

  async execute(clientId, files, uploadedBy, transaction) {
    if (!files) return [];

    const uploadedPublicIds = [];
    const documentsToSave = [];

    // Processar cada tipo de documento
    for (const [fieldName, docType] of Object.entries(this.FIELD_MAP)) {
      if (!files[fieldName]) continue;

      const fileList = files[fieldName];
      const typesForField = docType === 'documentos'
        ? ['documento1', 'documento2', 'documento3']
        : ['contrato'];

      for (let i = 0; i < fileList.length; i++) {
        try {
          const file = fileList[i];
          const prefix = docType === 'contrato'
            ? `contrato_${clientId}`
            : `documento_${clientId}_${i + 1}`;

          // Upload para Cloudinary
          const upload = await StorageService.uploadToCloudinary(
            file.buffer,
            prefix
          );

          uploadedPublicIds.push(upload.public_id);

          documentsToSave.push({
            client_id: clientId,
            cloudinary_public_id: upload.public_id,
            document_type: typesForField[i] || docType,
            original_name: file.originalname,
            mime_type: file.mimetype,
            file_size: file.size,
            uploaded_by: uploadedBy,
          });
        } catch (error) {
          console.error(`[ProcessDocumentsUseCase] Erro ao fazer upload:`, error);
          throw new AppError('Erro ao fazer upload de documento', 500);
        }
      }
    }

    if (documentsToSave.length === 0) return [];

    // Salvar no BD
    const records = await ClientDocument.bulkCreate(documentsToSave, { transaction });

    return records.map(doc => ({
      ...doc.toJSON(),
      download_url: `/api/v1/documents/${doc.id}/download`,
    }));
  }
}

module.exports = ProcessDocumentsUseCase;