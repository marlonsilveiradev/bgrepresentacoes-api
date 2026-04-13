/**
 * USE CASE: Download de Documento do Cliente
 *
 * ✅ Implementações:
 * - Controle de acesso (Admin, Owner, Partner)
 * - Validação de permissão antes de download
 * - Tratamento de timeouts
 * - Auditoria detalhada
 * - Logging estruturado
 */

const AppError = require('../../../shared/utils/AppError');
const logger = require('../../../infrastructure/config/logger');
const { ROLES } = require('../../../shared/constants/roles');

class DownloadClientDocumentUseCase {
  constructor(clientDocumentRepository, storageRepository) {
    this.clientDocumentRepository = clientDocumentRepository;
    this.storageRepository = storageRepository;
  }

  /**
   * Download de documento do cliente com controle de acesso robusto
   *
   * **Processo:**
   * 1. Validar autenticação (já feita no middleware)
   * 2. Buscar documento com informações do cliente
   * 3. Validar permissão de acesso
   * 4. Fazer download do Cloudinary (com timeout)
   * 5. Retornar buffer + metadados
   *
 * **Controle de Acesso:**
 * - Admin: acessa qualquer documento
 * - User: acessa apenas documentos de clientes que criou (created_by)
 * - Partner: sem permissão de download (negado na rota e na use case)
   *
   * @param {string} documentId - ID do documento (UUID)
   * @param {Object} requester - Dados do usuário autenticado (vem do middleware)
   * @returns {Promise<{buffer, contentType, filename, size, documentType}>}
   * @throws {AppError} Se documento não existir, acesso negado ou timeout
   */
  async execute(documentId, requester) {
    const transactionId = `download-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    try {
      logger.info(
        {
          transactionId,
          documentId,
          userId: requester.id,
          userRole: requester.role,
        },
        '[DownloadClientDocumentUseCase] Iniciando download de documento'
      );

      // ✅ PASSO 1: Buscar documento com relação ao cliente
      const doc = await this._fetchDocument(documentId, transactionId);

      // ✅ PASSO 2: Validar permissão de acesso
      this._assertCanDownload(doc, requester, transactionId);

      // ✅ PASSO 3: Download do Cloudinary (com timeout automático)
      const { buffer, contentType } = await this._downloadFromStorage(
        doc.cloudinary_public_id,
        transactionId
      );

      // ✅ PASSO 4: Preparar resposta com metadados
      const response = this._prepareResponse(doc, buffer, contentType);

      // ✅ PASSO 5: Log de auditoria (sucesso)
      logger.info(
        {
          transactionId,
          documentId: doc.id,
          userId: requester.id,
          clientId: doc.client_id,
          documentType: doc.document_type,
          fileSize: buffer.length,
          contentType,
          publicId: doc.cloudinary_public_id,
        },
        '[DownloadClientDocumentUseCase] Download concluído com sucesso'
      );

      return response;

    } catch (error) {
      if (error instanceof AppError) {
        logger.warn(
          {
            transactionId,
            documentId,
            userId: requester.id,
            errorCode: error.code,
            errorMessage: error.message,
          },
          '[DownloadClientDocumentUseCase] Erro esperado (AppError)'
        );

        throw error;
      }

      // Erro inesperado
      logger.error(
        {
          transactionId,
          documentId,
          userId: requester.id,
          error: error.message,
          stack: error.stack,
        },
        '[DownloadClientDocumentUseCase] Erro inesperado'
      );

      throw new AppError(
        'Erro ao fazer download do documento',
        500,
        'DOCUMENT_DOWNLOAD_ERROR'
      );
    }
  }

  /**
   * Buscar documento com informações do cliente
   * @private
   */
  async _fetchDocument(documentId, transactionId) {
    try {
      logger.debug(
        { transactionId, documentId },
        '[DownloadClientDocumentUseCase._fetchDocument] Buscando documento'
      );

      const doc = await this.clientDocumentRepository.findByIdWithClient(documentId);

      if (!doc) {
        logger.warn(
          { transactionId, documentId },
          '[DownloadClientDocumentUseCase._fetchDocument] Documento não encontrado'
        );

        throw new AppError('Documento não encontrado.', 404, 'DOCUMENT_NOT_FOUND');
      }

      if (!doc.cloudinary_public_id) {
        logger.error(
          { transactionId, documentId },
          '[DownloadClientDocumentUseCase._fetchDocument] Documento sem arquivo associado'
        );

        throw new AppError(
          'Documento não possui arquivo associado.',
          404,
          'FILE_NOT_ASSOCIATED'
        );
      }

      logger.debug(
        { transactionId, documentId, clientId: doc.client_id },
        '[DownloadClientDocumentUseCase._fetchDocument] Documento encontrado'
      );

      return doc;

    } catch (error) {
      if (error instanceof AppError) throw error;

      logger.error(
        { transactionId, documentId, error: error.message },
        '[DownloadClientDocumentUseCase._fetchDocument] Erro ao buscar'
      );

      throw new AppError('Erro ao buscar documento', 500, 'DOCUMENT_FETCH_ERROR');
    }
  }

  /**
   * Download do arquivo do Cloudinary com tratamento de timeout
   * @private
   */
  async _downloadFromStorage(publicId, transactionId) {
    try {
      logger.debug(
        { transactionId, publicId },
        '[DownloadClientDocumentUseCase._downloadFromStorage] Iniciando download do Cloudinary'
      );

      // ✅ Usar método refatorado que já implementa timeout
      const result = await this.storageRepository.download(publicId);

      logger.debug(
        { transactionId, publicId, size: result.buffer.length },
        '[DownloadClientDocumentUseCase._downloadFromStorage] Download do Cloudinary concluído'
      );

      return result;

    } catch (error) {
      if (error instanceof AppError) {
        // Cloudinary errors já retornam AppError
        logger.warn(
          { transactionId, publicId, errorCode: error.code },
          '[DownloadClientDocumentUseCase._downloadFromStorage] Erro do StorageRepository'
        );

        throw error;
      }

      logger.error(
        { transactionId, publicId, error: error.message },
        '[DownloadClientDocumentUseCase._downloadFromStorage] Erro inesperado'
      );

      throw new AppError('Erro ao fazer download do arquivo', 500, 'STORAGE_ERROR');
    }
  }

  /**
   * Preparar resposta com metadados do documento
   * @private
   */
  _prepareResponse(doc, buffer, contentType) {
    return {
      buffer,
      contentType,
      filename: doc.original_name || this._generateDefaultFilename(doc.document_type),
      size: buffer.length,
      documentType: doc.document_type,
      mimeType: contentType,
    };
  }

  /**
   * Gerar nome de arquivo padrão se não houver original
   * @private
   */
  _generateDefaultFilename(documentType) {
    const typeMap = {
      company_document: 'contrato',
      proof_of_address: 'comprovante_endereco',
      bank_account_proof: 'comprovante_conta_bancaria',
      card_machine_proof: 'comprovante_maquina_cartao',
    };

    const baseType = typeMap[documentType] || 'documento';
    const timestamp = new Date().toISOString().split('T')[0];

    return `${baseType}_${timestamp}.pdf`;
  }

  /**
   * Validar permissão de acesso ao documento
   *
   * **Regras:**
   * - Admin: acessa QUALQUER documento
   * - User: acessa apenas documentos de clientes que criou (created_by)
   * - Partner: nunca autorizado (resposta uniforme 404)
   *
   * @private
   */
  _assertCanDownload(doc, requester, transactionId) {
    if (requester.role === ROLES.PARTNER) {
      logger.warn(
        {
          transactionId,
          documentId: doc.id,
          userId: requester.id,
          userRole: requester.role,
          reason: 'PARTNER_DOWNLOAD_FORBIDDEN',
        },
        '[DownloadClientDocumentUseCase._assertCanDownload] Parceiro sem permissão de download'
      );

      throw new AppError('Documento não encontrado.', 404, 'DOCUMENT_NOT_FOUND');
    }

    const isAdmin = requester.role === ROLES.ADMIN;
    const isOwner = doc.client?.created_by === requester.id;

    if (!isAdmin && !isOwner) {
      logger.warn(
        {
          transactionId,
          documentId: doc.id,
          userId: requester.id,
          userRole: requester.role,
          clientOwnerId: doc.client?.created_by,
          reason: `Usuário não é admin nem owner (${isOwner})`,
        },
        '[DownloadClientDocumentUseCase._assertCanDownload] Acesso negado'
      );

      throw new AppError('Acesso negado a este documento.', 403, 'DOCUMENT_ACCESS_DENIED');
    }

    logger.debug(
      {
        transactionId,
        documentId: doc.id,
        userId: requester.id,
        reason: isAdmin ? 'admin' : 'owner',
      },
      '[DownloadClientDocumentUseCase._assertCanDownload] Permissão validada'
    );
  }
}

module.exports = DownloadClientDocumentUseCase;