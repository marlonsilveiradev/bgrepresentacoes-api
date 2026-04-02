const { ClientDocument, Client } = require('../repositories/models');
const StorageService = require('./StorageService');
const AppError = require('../../shared/utils/AppError');
const logger = require('../config/logger');

class DocumentService {
  async downloadDocument(documentId, user) {
    // 1. Busca o documento com os dados do cliente
    const doc = await ClientDocument.findByPk(documentId, {
      include: [{
        model: Client,
        as: 'client',
        attributes: ['id', 'created_by', 'corporate_name'],
      }],
    });

    if (!doc) {
      throw new AppError('Documento não encontrado.', 404);
    }

    // 2. Verifica permissão
    const isAdmin = user.role === 'admin';
    const isOwner = doc.client?.created_by === user.id;

    if (!isAdmin && !isOwner) {
      throw new AppError('Acesso negado a este documento.', 403);
    }

    // 3. Faz o download interno do arquivo
    const { buffer, contentType } = await StorageService.downloadFileAsBuffer(
      doc.cloudinary_public_id
    );

    // 4. Log
    logger.info(
      { documentId, userId: user.id, publicId: doc.cloudinary_public_id },
      'Download de documento servido via proxy.'
    );

    return {
      buffer,
      contentType,
      filename: doc.original_name || 'documento',
    };
  }
}

module.exports = new DocumentService();