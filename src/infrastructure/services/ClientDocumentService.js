const { ClientDocument } = require('../repositories/models');
const StorageService = require('./StorageService');
const logger = require('../../infrastructure/config/logger');

class ClientDocumentService {
  // Mapeamento de campos do formulário para tipos de documento
  static FIELD_MAP = {
    contrato: 'company_document',
    proof_of_address: 'proof_of_address',
    bank_account_proof: 'bank_account_proof',
    card_machine_proof: 'card_machine_proof',
  };

  /**
   * Processa documentos enviados para um cliente: faz upload, substitui se existir,
   * e retorna os IDs dos arquivos enviados e dos antigos a serem removidos.
   * @param {Object} params
   * @param {string} params.clientId
   * @param {Object} params.files - Objeto com campos de arquivos (multer)
   * @param {string} params.requesterId
   * @param {Object} params.transaction - Transação Sequelize
   */
  async handleClientDocuments({ clientId, files, requesterId, transaction }) {
    const uploadedPublicIds = [];
    const oldPublicIdsToDelete = [];

    for (const [fieldName, docType] of Object.entries(ClientDocumentService.FIELD_MAP)) {
      if (files[fieldName]?.[0]) {
        const result = await this._processDocument({
          clientId,
          file: files[fieldName][0],
          docType,
          requesterId,
          transaction,
        });
        uploadedPublicIds.push(...result.uploadedPublicIds);
        oldPublicIdsToDelete.push(...result.oldPublicIdsToDelete);
      }
    }

    return { uploadedPublicIds, oldPublicIdsToDelete };
  }

  /**
   * Limpa arquivos do Cloudinary (usado em caso de sucesso ou rollback).
   * @param {Object} params
   * @param {string[]} params.uploadedPublicIds - IDs de arquivos recém-enviados (para rollback)
   * @param {string[]} params.oldPublicIdsToDelete - IDs de arquivos antigos (para limpeza pós-sucesso)
   */
  async cleanupDocuments({ uploadedPublicIds = [], oldPublicIdsToDelete = [] }) {
    const deletePromises = [
      ...oldPublicIdsToDelete.map(id => StorageService.deleteFromCloudinary(id)),
      ...uploadedPublicIds.map(id => StorageService.deleteFromCloudinary(id)),
    ];
    await Promise.allSettled(deletePromises).then(results => {
      results.forEach(result => {
        if (result.status === 'rejected') {
          logger.error({ err: result.reason }, 'Erro ao remover arquivo do Cloudinary');
        }
      });
    });
  }

  // ========== Métodos privados ==========

  async _processDocument({ clientId, file, docType, requesterId, transaction }) {
    const uploadedPublicIds = [];
    const oldPublicIdsToDelete = [];

    // 1. Upload do novo arquivo
    const upload = await StorageService.uploadToCloudinary(
      file.buffer,
      `client_${clientId}_${docType}`
    );
    uploadedPublicIds.push(upload.public_id);

    // 2. Verifica se já existe documento do mesmo tipo
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

    return { uploadedPublicIds, oldPublicIdsToDelete };
  }
}

module.exports = new ClientDocumentService();