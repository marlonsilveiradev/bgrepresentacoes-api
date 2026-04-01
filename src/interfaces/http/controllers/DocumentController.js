const { ClientDocument, Client } = require('../../../infrastructure/repositories/models');
const StorageService = require('../../../infrastructure/services/StorageService');
const AppError = require('../../../shared/utils/AppError');
const logger = require('../../../infrastructure/config/logger');

/**
 * GET /api/v1/documents/:id/download
 *
 * Faz proxy do arquivo do Cloudinary para o cliente autenticado.
 * A URL do Cloudinary NUNCA chega ao frontend.
 *
 * Permissões:
 *   admin           → qualquer documento
 *   user (vendedor) → apenas documentos de clientes que ele criou
 *
 * O frontend recebe o binário e cria uma URL local:
 *   const blob = await response.blob();
 *   const url  = URL.createObjectURL(blob);
 */
const download = async (req, res, next) => {
  try {
    const { id } = req.params;

    // 1. Busca o documento com os dados do cliente (para checar permissão)
    const doc = await ClientDocument.findByPk(id, {
      include: [{
        model:      Client,
        as:         'client',
        attributes: ['id', 'created_by', 'corporate_name'],
      }],
    });

    if (!doc) {
      throw new AppError('Documento não encontrado.', 404);
    }

    // 2. Verifica permissão
    const isAdmin = req.user.role === 'admin';
    const isOwner = doc.client?.created_by === req.user.id;

    if (!isAdmin && !isOwner) {
      throw new AppError('Acesso negado a este documento.', 403);
    }

    // 3. Faz o download internamente via StorageService (https nativo)
    const { buffer, contentType } = await StorageService.downloadFileAsBuffer(
      doc.cloudinary_public_id
    );

    // 4. Define headers adequados para o browser renderizar ou baixar
    const safeFilename = encodeURIComponent(doc.original_name || 'documento');
    res.setHeader('Content-Type',        contentType);
    res.setHeader('Content-Length',      buffer.length);
    res.setHeader('Content-Disposition', `inline; filename="${safeFilename}"`);
    res.setHeader('Cache-Control',       'private, no-store'); // não cachear no browser

    logger.info(
      { documentId: id, userId: req.user.id, publicId: doc.cloudinary_public_id },
      'Download de documento servido via proxy.'
    );

    // 5. Envia o binário — o frontend recebe como Blob
    return res.end(buffer);

  } catch (err) {
    return next(err);
  }
};

module.exports = { download };