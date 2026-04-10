const AppError = require('../../../shared/utils/AppError');
const logger = require('../../../infrastructure/config/logger');
const { ROLES } = require('../../../shared/constants/roles');
const { sanitizeClientData } = require('../../../shared/helpers/clientSanitizer');

class UpdateClientUseCase {
  constructor(
    clientRepository,
    clientBankAccountRepository,
    clientDocumentRepository,
    processClientDocumentsUseCase,
    storageRepository,
    sequelize
  ) {
    this.clientRepository = clientRepository;
    this.clientBankAccountRepository = clientBankAccountRepository;
    this.clientDocumentRepository = clientDocumentRepository;
    this.processClientDocumentsUseCase = processClientDocumentsUseCase;
    this.storageRepository = storageRepository;
    this.sequelize = sequelize;
  }

  async execute(clientId, data, requester, files) {
    const transactionId = `upd-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    let uploadedPublicIds = [];
    let oldPublicIdsToDelete = [];

    try {
      logger.info(
        { transactionId, clientId, userId: requester.id },
        '[UpdateClientUseCase] Iniciando atualização de cliente'
      );

      // ✅ Buscar cliente
      const client = await this.clientRepository.findById(clientId);
      if (!client) {
        throw new AppError('Cliente não encontrado.', 404, 'CLIENT_NOT_FOUND');
      }

      // ✅ Validar permissão
      this._assertCanWrite(client, requester);

      // ✅ Sanitizar dados conforme papel
      const sanitizedData = sanitizeClientData(data, requester.role);

      if (Object.keys(sanitizedData).length === 0 && (!files || Object.keys(files).length === 0)) {
        throw new AppError('Nenhum dado para atualizar fornecido.', 400, 'NO_UPDATE_DATA');
      }

      // ✅ Iniciar transação
      const transaction = await this.sequelize.transaction();

      try {
        // ✅ Atualizar dados do cliente
        if (Object.keys(sanitizedData).length > 0) {
          await client.update(sanitizedData, { transaction });
        }

        // ✅ Processar documentos se enviados
        if (files && Object.keys(files).length > 0) {
          const docResult = await this.processClientDocumentsUseCase.execute({
            clientId,
            files,
            userId: requester.id,
            transaction,
          });

          uploadedPublicIds = docResult.uploadedPublicIds;

          if (docResult.documents && docResult.documents.length > 0) {
            for (const doc of docResult.documents) {
              if (doc.isUpdate) {
                await this.clientDocumentRepository.update(
                  doc.existingId,
                  doc.data,
                  { transaction }
                );
                if (doc.oldPublicId) {
                  oldPublicIdsToDelete.push(doc.oldPublicId);
                }
              } else {
                await this.clientDocumentRepository.create(doc.data, { transaction });
              }
            }
          }
        }

        // ✅ Atualizar conta bancária se fornecida
        if (data.bankAccount) {
          await this._handleBankAccountUpdate(clientId, data.bankAccount, transaction);
        }

        // ✅ COMMIT
        await transaction.commit();

        logger.info(
          { transactionId, clientId },
          '[UpdateClientUseCase] Cliente atualizado com sucesso'
        );

        // ✅ Cleanup de arquivos antigos APÓS commit
        if (oldPublicIdsToDelete.length > 0) {
          this._scheduleOldFilesCleanup(oldPublicIdsToDelete, transactionId);
        }

        return client;

      } catch (error) {
        await transaction.rollback();
        logger.warn(
          { transactionId, clientId, error: error.message },
          '[UpdateClientUseCase] Transação desfeita'
        );

        // Cleanup de uploads novos
        if (uploadedPublicIds.length > 0) {
          await this._cleanupFailedUploads(uploadedPublicIds, transactionId);
        }

        throw error;
      }

    } catch (error) {
      if (error instanceof AppError) throw error;

      logger.error(
        { transactionId, clientId, error: error.message },
        '[UpdateClientUseCase] Erro ao atualizar cliente'
      );

      throw new AppError('Erro ao atualizar cliente', 500, 'CLIENT_UPDATE_ERROR');
    }
  }

  async _handleBankAccountUpdate(clientId, bankData, transaction) {
    const existing = await this.clientBankAccountRepository.findByClientId(clientId, { transaction });

    if (existing && existing.length > 0) {
      // Atualizar primeira conta existente
      await this.clientBankAccountRepository.update(
        existing[0].id,
        bankData,
        { transaction }
      );
    } else {
      // Criar nova conta
      await this.clientBankAccountRepository.create(
        { client_id: clientId, ...bankData },
        { transaction }
      );
    }
  }

  _assertCanWrite(client, requester) {
    const isAdmin = requester.role === ROLES.ADMIN;
    const isOwner = client.created_by === requester.id;

    if (!isAdmin && !isOwner) {
      throw new AppError('Você não tem permissão para atualizar este cliente.', 403);
    }
  }

  _scheduleOldFilesCleanup(publicIds, transactionId) {
    setImmediate(async () => {
      try {
        await Promise.all(
          publicIds.map(id => 
            this.storageRepository.delete(id).catch(err => {
              logger.warn(
                { error: err.message, publicId: id, transactionId },
                '[UpdateClientUseCase] Erro ao deletar arquivo antigo'
              );
            })
          )
        );
      } catch (error) {
        logger.error(
          { error: error.message, transactionId },
          '[UpdateClientUseCase] Erro no cleanup'
        );
      }
    });
  }

  async _cleanupFailedUploads(uploadedPublicIds, transactionId) {
    try {
      await Promise.all(
        uploadedPublicIds.map(id =>
          this.storageRepository.delete(id).catch(err => {
            logger.warn({ error: err.message, publicId: id }, '[UpdateClientUseCase] Cleanup fallback');
          })
        )
      );
    } catch (error) {
      logger.error({ error: error.message }, '[UpdateClientUseCase] Erro no cleanup fallback');
    }
  }
}

module.exports = UpdateClientUseCase;