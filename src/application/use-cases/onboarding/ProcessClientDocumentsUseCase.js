/**
 * USE CASE: Process Client Documents (Onboarding)
 * 
 * Responsabilidade:
 * - Validar arquivos de entrada
 * - Fazer upload para storage
 * - Persistir registros no banco
 * - Rastrear público_ids para cleanup em caso de erro
 * 
 * ✅ Completamente desacoplado de Service
 * ✅ Transação é controlada por quem chama
 * ✅ Retorna rastreamento de uploads para rollback
 */

const AppError = require('../../../shared/utils/AppError');
const logger = require('../../../infrastructure/config/logger');

class ProcessClientDocumentsUseCase {
  constructor(
    clientDocumentRepository,
    storageRepository
  ) {
    this.clientDocumentRepository = clientDocumentRepository;
    this.storageRepository = storageRepository;
  }

  /**
   * Processar documentos do onboarding
   * 
   * @param {Object} params
   * @param {string} params.clientId - ID do cliente
   * @param {Object} params.files - Objeto com arrays de arquivos (multer format)
   * @param {string} params.userId - ID do usuário que está fazendo upload
   * @param {Object} params.transaction - Transaction do Sequelize
   * @returns {Promise<{documents: Array, uploadedPublicIds: string[]}>}
   */
  async execute({ clientId, files, userId, transaction }) {
    const transactionId = `doc-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const uploadedPublicIds = [];
    const documentsToCreate = [];

    try {
      logger.info(
        { transactionId, clientId, filesCount: Object.keys(files || {}).length },
        '[ProcessClientDocumentsUseCase] Iniciando processamento de documentos'
      );

      // ✅ Validar que há arquivos
      if (!files || Object.keys(files).length === 0) {
        logger.debug(
          { transactionId, clientId },
          '[ProcessClientDocumentsUseCase] Nenhum arquivo enviado'
        );
        return {
          documents: [],
          uploadedPublicIds: [],
        };
      }

      // ✅ Processar cada tipo de documento
      const documentTypes = this._getDocumentTypes();
      
      for (const [fieldName, docType] of Object.entries(documentTypes)) {
        if (files[fieldName]?.[0]) {
          const result = await this._processSingleDocument({
            clientId,
            file: files[fieldName][0],
            docType,
            userId,
            transactionId,
            transaction,
          });

          uploadedPublicIds.push(...result.uploadedPublicIds);
          documentsToCreate.push(...result.documentsToCreate);
        }
      }

      logger.info(
        { transactionId, documentCount: documentsToCreate.length },
        '[ProcessClientDocumentsUseCase] Documentos prontos para persistência'
      );

      return {
        documents: documentsToCreate,
        uploadedPublicIds,
      };

    } catch (error) {
      logger.error(
        { transactionId, error: error.message },
        '[ProcessClientDocumentsUseCase] Erro ao processar documentos'
      );

      // ✅ Limpar uploads em caso de erro
      await this._cleanupFailedUploads(uploadedPublicIds, transactionId);

      throw error;
    }
  }

  /**
   * Processar um documento individual
   */
  async _processSingleDocument({
    clientId,
    file,
    docType,
    userId,
    transactionId,
    transaction,
  }) {
    try {
      logger.debug(
        { transactionId, docType, filename: file.originalname },
        '[ProcessClientDocumentsUseCase._processSingleDocument] Processando documento'
      );

      // ✅ PASSO 1: Validar arquivo
      this._validateFile(file);

      // ✅ PASSO 2: Fazer upload
      const uploadResult = await this.storageRepository.upload(
        file.buffer,
        `client_${clientId}_${docType}_${Date.now()}`
      );

      logger.debug(
        { transactionId, publicId: uploadResult.public_id },
        '[ProcessClientDocumentsUseCase._processSingleDocument] Upload concluído'
      );

      // ✅ PASSO 3: Verificar se documento já existe
      const existingDoc = await this.clientDocumentRepository.findByType(
        clientId,
        docType,
        { transaction }
      );

      if (existingDoc) {
        logger.debug(
          { transactionId, docType },
          '[ProcessClientDocumentsUseCase._processSingleDocument] Documento já existe, será atualizado'
        );
      }

      // ✅ PASSO 4: Preparar dados para persistência
      const documentData = {
        client_id: clientId,
        document_type: docType,
        cloudinary_public_id: uploadResult.public_id,
        original_name: file.originalname,
        mime_type: file.mimetype,
        file_size: file.size,
        uploaded_by: userId,
      };

      return {
        uploadedPublicIds: [uploadResult.public_id],
        documentsToCreate: [
          {
            data: documentData,
            isUpdate: !!existingDoc,
            existingId: existingDoc?.id,
            oldPublicId: existingDoc?.cloudinary_public_id,
          },
        ],
      };

    } catch (error) {
      if (error instanceof AppError) throw error;

      logger.error(
        { transactionId, error: error.message, docType },
        '[ProcessClientDocumentsUseCase._processSingleDocument] Erro'
      );
      throw new AppError(
        `Erro ao processar documento ${docType}`,
        500,
        'DOCUMENT_PROCESSING_ERROR'
      );
    }
  }

  /**
   * Validar arquivo
   */
  _validateFile(file) {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedMimes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (file.size > maxSize) {
      throw new AppError(
        'Arquivo muito grande (máximo 5MB)',
        400,
        'FILE_TOO_LARGE'
      );
    }

    if (!allowedMimes.includes(file.mimetype)) {
      throw new AppError(
        'Tipo de arquivo não permitido',
        400,
        'INVALID_FILE_TYPE'
      );
    }
  }

  /**
   * Obter tipos de documento mapeados
   */
  _getDocumentTypes() {
    return {
      contrato: 'company_document',
      proof_of_address: 'proof_of_address',
      bank_account_proof: 'bank_account_proof',
      card_machine_proof: 'card_machine_proof',
    };
  }
  async findByType(clientId, documentType, options = {}) {
  return await this.model.findOne({
    where: {
      client_id: clientId,
      document_type: documentType,
    },
    transaction: options.transaction || null,
  });
}

  /**
   * Limpar uploads falhados
   */
  async _cleanupFailedUploads(uploadedPublicIds, transactionId) {
    if (!uploadedPublicIds.length) return;

    logger.warn(
      { transactionId, count: uploadedPublicIds.length },
      '[ProcessClientDocumentsUseCase] Limpando uploads falhados'
    );

    const deletePromises = uploadedPublicIds.map(id =>
      this.storageRepository.delete(id).catch(err => {
        logger.warn(
          { error: err.message, publicId: id },
          '[ProcessClientDocumentsUseCase._cleanupFailedUploads] Erro ao deletar'
        );
      })
    );

    await Promise.allSettled(deletePromises);
  }
}

module.exports = ProcessClientDocumentsUseCase;