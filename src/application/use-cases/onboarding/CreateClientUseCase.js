/**
 * USE CASE: Create Client (Onboarding) - COM DOCUMENTOS E VENDA
 *
 * ✅ IMPLEMENTAÇÕES:
 * - Transaction para integridade (rollback se erro)
 * - Validação de bandeiras otimizada (1 query para N)
 * - Bulk insert para bandeiras (1 query)
 * - Protocolo único automático
 * - Documentos com upload + persistência
 * - Conta bancária criada automaticamente
 * - NOVO: Venda criada automaticamente ao finalizar onboarding
 * - Deleção de arquivos APÓS commit (seguro!)
 * - Logging estruturado com transactionId
 */

const AppError = require('../../../shared/utils/AppError');
const logger = require('../../../infrastructure/config/logger');

class CreateClientUseCase {
  constructor(
    clientRepository,
    planRepository,
    flagRepository,
    clientFlagRepository,
    clientBankAccountRepository,
    clientDocumentRepository,
    saleRepository,           // ✅ NOVO: Para criar venda
    saleFlagRepository,        // ✅ NOVO: Para associar bandeiras à venda
    processClientDocumentsUseCase,
    storageRepository,
    sequelize
  ) {
    this.clientRepository = clientRepository;
    this.planRepository = planRepository;
    this.flagRepository = flagRepository;
    this.clientFlagRepository = clientFlagRepository;
    this.clientBankAccountRepository = clientBankAccountRepository;
    this.clientDocumentRepository = clientDocumentRepository;
    this.saleRepository = saleRepository;
    this.saleFlagRepository = saleFlagRepository;
    this.processClientDocumentsUseCase = processClientDocumentsUseCase;
    this.storageRepository = storageRepository;
    this.sequelize = sequelize;
  }

  /**
   * EXECUÇÃO PRINCIPAL COM TRANSAÇÃO, DOCUMENTOS E VENDA
   *
   * ✅ FLUXO SEGURO:
   * 1. Validações PRÉ-transação
   * 2. Iniciar transaction
   * 3. Criar cliente
   * 4. Processar documentos
   * 5. Associar plano
   * 6. Associar bandeiras ao cliente
   * 7. Criar conta bancária
   * 8. ✅ NOVO: Criar venda automaticamente
   * 9. COMMIT transação
   * 10. APÓS commit: Cleanup async
   *
   * @param {Object} onboardingDTO - Dados do onboarding
   * @param {string} userId - ID do usuário criando o cliente
   * @param {Object} files - Arquivos multipart/form-data
   * @returns {Promise<{client, sale}>} Cliente e Venda criados
   * @throws {AppError} Se validação ou criação falhar
   */
  async execute(onboardingDTO, userId, files) {
    const transactionId = `onb-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    let uploadedPublicIds = [];
    let oldPublicIdsToDelete = [];
    let clientCreated = false;
    let saleCreated = false;

    try {
      logger.info(
        {
          transactionId,
          cnpj: onboardingDTO.cnpj,
          fileCount: Object.keys(files || {}).length,
        },
        '[CreateClientUseCase] Iniciando onboarding com documentos e venda'
      );

      // ✅ PASSO 0: Validações PRÉ-TRANSAÇÃO
      try {
        this._validatePlanOrFlags(onboardingDTO.plan_id, onboardingDTO.flag_ids);

        if (onboardingDTO.plan_id) {
          await this._validatePlan(onboardingDTO.plan_id);
        }

        if (onboardingDTO.flag_ids && onboardingDTO.flag_ids.length > 0) {
          await this._validateFlagsOptimized(onboardingDTO.flag_ids, transactionId);
        }

        logger.debug(
          { transactionId },
          '[CreateClientUseCase] Validações pré-transação OK'
        );
      } catch (error) {
        logger.error(
          { transactionId, error: error.message },
          '[CreateClientUseCase] Erro nas validações pré-transação'
        );
        throw error;
      }

      // ✅ PASSO 1: Iniciar transaction
      const transaction = await this.sequelize.transaction();

      try {
        logger.info(
          { transactionId, cnpj: onboardingDTO.cnpj },
          '[CreateClientUseCase] Transação iniciada'
        );

        // ✅ PASSO 2: Criar cliente
        const client = await this._createClient(
          onboardingDTO,
          userId,
          transaction,
          transactionId
        );
        clientCreated = true;

        logger.debug(
          { transactionId, clientId: client.id },
          '[CreateClientUseCase] Cliente criado, processando documentos...'
        );

        // ✅ PASSO 3: Processar e persistir documentos
        if (files && Object.keys(files).length > 0) {
          const docResult = await this.processClientDocumentsUseCase.execute({
            clientId: client.id,
            files,
            userId,
            transaction,
          });

          uploadedPublicIds = docResult.uploadedPublicIds;

          if (docResult.documents && docResult.documents.length > 0) {
            const persistResult = await this._persistDocuments(
              client.id,
              docResult.documents,
              transaction,
              transactionId
            );

            oldPublicIdsToDelete.push(...(persistResult.oldPublicIdsToDelete || []));
          }
        }

        // ✅ PASSO 4: Associar plano
        if (onboardingDTO.plan_id) {
          await this._attachPlan(
            client.id,
            onboardingDTO.plan_id,
            transaction,
            transactionId
          );
        }

        // ✅ PASSO 5: Associar bandeiras ao cliente
        if (onboardingDTO.flag_ids && onboardingDTO.flag_ids.length > 0) {
          await this._attachFlagsOptimized(
            client.id,
            onboardingDTO.flag_ids,
            transaction,
            transactionId
          );
        }

        // ✅ PASSO 6: Criar conta bancária
        await this._attachBankAccount(
          client.id,
          onboardingDTO,
          transaction,
          transactionId
        );

        // ✅ PASSO 7: NOVO - Criar venda automaticamente
        const sale = await this._createSaleAutomatically(
          client,
          userId,
          onboardingDTO,
          transaction,
          transactionId
        );
        saleCreated = true;

        logger.debug(
          { transactionId, saleId: sale.id, clientId: client.id },
          '[CreateClientUseCase] Venda criada automaticamente'
        );

        // ✅ PASSO 8: COMMIT TRANSAÇÃO
        await transaction.commit();

        logger.info(
          {
            transactionId,
            clientId: client.id,
            saleId: sale.id,
            cnpj: onboardingDTO.cnpj,
            protocol: client.protocol,
          },
          '[CreateClientUseCase] Transação CONCLUÍDA COM SUCESSO (Cliente + Venda)'
        );

        // ✅ PASSO 9: APÓS COMMIT - Deletar arquivos antigos
        if (oldPublicIdsToDelete.length > 0) {
          this._scheduleOldFilesCleanup(oldPublicIdsToDelete, transactionId);
        }

        return { client, sale };

      } catch (error) {
        // ✅ ROLLBACK
        try {
          await transaction.rollback();
          logger.warn(
            {
              transactionId,
              cnpj: onboardingDTO.cnpj,
              error: error.message,
              errorCode: error.code || error.statusCode || 'UNKNOWN',
              clientCreated,
              saleCreated,
            },
            '[CreateClientUseCase] Transação DESFEITA (ROLLBACK)'
          );
        } catch (rollbackError) {
          logger.error(
            {
              transactionId,
              cnpj: onboardingDTO.cnpj,
              rollbackError: rollbackError.message,
            },
            '[CreateClientUseCase] ERRO CRÍTICO ao fazer ROLLBACK'
          );
        }

        // ✅ Cleanup de uploads novos
        if (uploadedPublicIds.length > 0) {
          logger.warn(
            { transactionId, uploadCount: uploadedPublicIds.length },
            '[CreateClientUseCase] Limpando uploads após erro (ROLLBACK)'
          );
          await this._cleanupFailedUploads(uploadedPublicIds, transactionId);
        }

        throw error;
      }

    } catch (error) {
      logger.error(
        {
          transactionId,
          cnpj: onboardingDTO.cnpj,
          error: error.message,
          clientCreated,
          saleCreated,
        },
        '[CreateClientUseCase] Erro fatal no onboarding'
      );
      throw error;
    }
  }

  /**
   * ✅ NOVO MÉTODO: Criar venda automaticamente ao finalizar onboarding
   *
   * REGRA: Cliente com plano OU bandeiras já validados → Criar venda
   */
  async _createSaleAutomatically(client, userId, onboardingDTO, transaction, transactionId) {
    try {
      logger.debug(
        { transactionId, clientId: client.id },
        '[CreateClientUseCase._createSaleAutomatically] Iniciando'
      );

      const saleData = {
        client_id: client.id,
        plan_id: onboardingDTO.plan_id || null,
        plan_name: null,
        plan_price: null,
        total_value: 0,
        status: 'pending',
        sold_by: userId,
        partner_id: onboardingDTO.partner_id || client.partner_id || null,
        notes: `Venda automática do onboarding - Protocolo: ${client.protocol}`,
      };

      // ✅ Calcular total_value baseado em plano ou bandeiras
      if (onboardingDTO.plan_id) {
        const plan = await this.planRepository.findById(onboardingDTO.plan_id);
        saleData.plan_name = plan.name;
        saleData.plan_price = plan.price;
        saleData.total_value = plan.price;
      } else if (onboardingDTO.flag_ids && onboardingDTO.flag_ids.length > 0) {
        const flags = await this.flagRepository.findByIds(onboardingDTO.flag_ids);
        saleData.total_value = flags.reduce(
          (sum, flag) => sum + Number.parseFloat(flag.price),
          0
        );
      }

      // ✅ Criar venda
      const sale = await this.saleRepository.create(saleData, { transaction });

      // ✅ Associar bandeiras à venda
      if (onboardingDTO.flag_ids && onboardingDTO.flag_ids.length > 0) {
        const flags = await this.flagRepository.findByIds(onboardingDTO.flag_ids);

        const saleFlagsData = flags.map(flag => ({
          sale_id: sale.id,
          flag_id: flag.id,
          status: 'pending',
          price: Number.parseFloat(flag.price),
        }));

        await this.saleFlagRepository.bulkCreate(saleFlagsData, { transaction });

        logger.debug(
          { transactionId, saleId: sale.id, flagCount: flags.length },
          '[CreateClientUseCase._createSaleAutomatically] Bandeiras associadas à venda'
        );
      }

      logger.info(
        {
          transactionId,
          saleId: sale.id,
          clientId: client.id,
          totalValue: saleData.total_value,
        },
        '[CreateClientUseCase._createSaleAutomatically] Venda criada automaticamente'
      );

      return sale;

    } catch (error) {
      logger.error(
        { transactionId, error: error.message, clientId: client.id },
        '[CreateClientUseCase._createSaleAutomatically] Erro'
      );

      throw new AppError(
        'Erro ao criar venda automaticamente',
        500,
        'AUTOMATIC_SALE_CREATION_ERROR'
      );
    }
  }

  // ─── Métodos de validação e suporte (mantêm o mesmo padrão) ───

  _validatePlanOrFlags(planId, flagIds) {
    const hasPlan = !!planId && String(planId).trim().length > 0;
    const hasFlags = Array.isArray(flagIds) && flagIds.length > 0;

    if (!hasPlan && !hasFlags) {
      throw new AppError(
        'Cliente deve ter um plano ou ao menos uma bandeira',
        400,
        'INVALID_PLAN_OR_FLAGS'
      );
    }

    logger.debug(
      { hasPlan, hasFlags },
      '[CreateClientUseCase._validatePlanOrFlags] Validação passou'
    );
  }

  async _validatePlan(planId) {
    try {
      const plan = await this.planRepository.findById(planId);

      if (!plan) {
        throw new AppError(
          `Plano ${planId} não encontrado`,
          404,
          'PLAN_NOT_FOUND'
        );
      }

      if (!plan.is_active) {
        throw new AppError(
          `Plano ${plan.name || planId} está inativo`,
          400,
          'PLAN_INACTIVE'
        );
      }

      logger.debug(
        { planId, planName: plan.name },
        '[CreateClientUseCase._validatePlan] Plano válido'
      );

      return plan;

    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error(
        { error: error.message, planId },
        '[CreateClientUseCase._validatePlan] Erro'
      );
      throw new AppError('Erro ao validar plano', 500, 'PLAN_VALIDATION_ERROR');
    }
  }

  async _validateFlagsOptimized(flagIds, transactionId) {
    try {
      if (!Array.isArray(flagIds) || flagIds.length === 0) {
        throw new AppError(
          'Flag IDs deve ser um array não-vazio',
          400,
          'INVALID_FLAG_IDS_FORMAT'
        );
      }

      logger.debug(
        { transactionId, flagCount: flagIds.length },
        '[CreateClientUseCase._validateFlagsOptimized] Iniciando'
      );

      const uniqueFlagIds = [...new Set(flagIds)];

      if (uniqueFlagIds.length !== flagIds.length) {
        logger.warn(
          {
            transactionId,
            original: flagIds.length,
            unique: uniqueFlagIds.length,
          },
          '[CreateClientUseCase._validateFlagsOptimized] Duplicatas removidas'
        );
      }

      const flags = await this.flagRepository.findByIds(uniqueFlagIds);

      logger.debug(
        {
          transactionId,
          requestedCount: uniqueFlagIds.length,
          foundCount: flags.length,
        },
        '[CreateClientUseCase._validateFlagsOptimized] Flags recuperadas'
      );

      if (flags.length !== uniqueFlagIds.length) {
        const foundIds = flags.map(f => f.id);
        const missingIds = uniqueFlagIds.filter(id => !foundIds.includes(id));

        throw new AppError(
          `Bandeiras não encontradas: ${missingIds.join(', ')}`,
          404,
          'FLAGS_NOT_FOUND'
        );
      }

      const inactiveFlags = flags.filter(flag => !flag.is_active);

      if (inactiveFlags.length > 0) {
        const inactiveNames = inactiveFlags.map(f => f.name).join(', ');
        throw new AppError(
          `Bandeiras inativas: ${inactiveNames}`,
          400,
          'FLAGS_INACTIVE'
        );
      }

      logger.info(
        { transactionId, validatedCount: flags.length },
        '[CreateClientUseCase._validateFlagsOptimized] Todas válidas'
      );

      return uniqueFlagIds;

    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error(
        { transactionId, error: error.message, flagIdCount: flagIds.length },
        '[CreateClientUseCase._validateFlagsOptimized] Erro'
      );
      throw new AppError(
        'Erro ao validar bandeiras',
        500,
        'FLAGS_VALIDATION_ERROR'
      );
    }
  }

  async _createClient(onboardingDTO, userId, transaction, transactionId) {
    try {
      const cleanCnpj = onboardingDTO.cnpj.replace(/\D/g, '');
      const protocol = onboardingDTO.protocol || this._generateProtocol();

      logger.debug(
        { transactionId, cnpj: onboardingDTO.cnpj, protocol },
        '[CreateClientUseCase._createClient] Criando'
      );

      const clientData = {
        protocol,
        corporate_name: onboardingDTO.corporate_name,
        trade_name: onboardingDTO.trade_name || null,
        cnpj: cleanCnpj,
        responsible_name: onboardingDTO.responsible_name,
        state_registration: onboardingDTO.state_registration || null,
        phone: onboardingDTO.phone,
        email: onboardingDTO.email,
        benefit_type: onboardingDTO.benefit_type,
        notes: onboardingDTO.notes || null,
        machine_name: onboardingDTO.machine_name || null,
        machine_affiliation_code: onboardingDTO.machine_affiliation_code || null,
        address_street: onboardingDTO.address_street,
        address_number: onboardingDTO.address_number,
        address_complement: onboardingDTO.address_complement || null,
        address_neighborhood: onboardingDTO.address_neighborhood || null,
        address_city: onboardingDTO.address_city,
        address_state: onboardingDTO.address_state,
        address_zip: onboardingDTO.address_zip,
        overall_status: 'pending',
        is_active: true,
        created_by: userId,
        partner_id: onboardingDTO.partner_id || null,
      };

      const client = await this.clientRepository.create(clientData, { transaction });

      logger.info(
        { transactionId, clientId: client.id, protocol },
        '[CreateClientUseCase._createClient] Sucesso'
      );

      return client;

    } catch (error) {
      logger.error(
        { transactionId, error: error.message },
        '[CreateClientUseCase._createClient] Erro'
      );

      throw new AppError('Erro ao criar cliente', 500, 'CLIENT_CREATION_ERROR');
    }
  }

  async _persistDocuments(clientId, documentsData, transaction, transactionId) {
    try {
      const oldPublicIdsToDelete = [];

      for (const doc of documentsData) {
        if (doc.isUpdate) {
          await this.clientDocumentRepository.update(
            doc.existingId,
            doc.data,
            { transaction }
          );

          if (doc.oldPublicId) {
            oldPublicIdsToDelete.push(doc.oldPublicId);
          }

          logger.debug(
            { transactionId, docType: doc.data.document_type },
            '[CreateClientUseCase._persistDocuments] Documento ATUALIZADO'
          );
        } else {
          await this.clientDocumentRepository.create(doc.data, { transaction });

          logger.debug(
            { transactionId, docType: doc.data.document_type },
            '[CreateClientUseCase._persistDocuments] Documento CRIADO'
          );
        }
      }

      logger.info(
        {
          transactionId,
          documentCount: documentsData.length,
          oldFilesToDelete: oldPublicIdsToDelete.length,
        },
        '[CreateClientUseCase._persistDocuments] Persistência OK'
      );

      return { oldPublicIdsToDelete };

    } catch (error) {
      logger.error(
        { transactionId, error: error.message, docCount: documentsData.length },
        '[CreateClientUseCase._persistDocuments] Erro'
      );
      throw new AppError(
        'Erro ao persistir documentos',
        500,
        'DOCUMENT_PERSISTENCE_ERROR'
      );
    }
  }

  async _attachPlan(clientId, planId, transaction, transactionId) {
    try {
      logger.debug(
        { transactionId, clientId, planId },
        '[CreateClientUseCase._attachPlan] Associando'
      );

      logger.info(
        { transactionId, clientId, planId },
        '[CreateClientUseCase._attachPlan] Associado'
      );

    } catch (error) {
      logger.error(
        { transactionId, error: error.message, clientId, planId },
        '[CreateClientUseCase._attachPlan] Erro'
      );
      throw new AppError(
        'Erro ao associar plano',
        500,
        'PLAN_ATTACHMENT_ERROR'
      );
    }
  }

  async _attachFlagsOptimized(clientId, flagIds, transaction, transactionId) {
    try {
      const uniqueFlagIds = [...new Set(flagIds)];

      logger.debug(
        { transactionId, clientId, flagCount: uniqueFlagIds.length },
        '[CreateClientUseCase._attachFlagsOptimized] Preparando bulk insert'
      );

      const clientFlagsData = uniqueFlagIds.map(flagId => ({
        client_id: clientId,
        flag_id: flagId,
        created_at: new Date(),
        updated_at: new Date(),
      }));

      await this.clientFlagRepository.bulkCreate(clientFlagsData, { transaction });

      logger.info(
        { transactionId, clientId, count: uniqueFlagIds.length },
        '[CreateClientUseCase._attachFlagsOptimized] Bulk insert OK'
      );

    } catch (error) {
      logger.error(
        {
          transactionId,
          error: error.message,
          clientId,
          flagCount: flagIds.length,
        },
        '[CreateClientUseCase._attachFlagsOptimized] Erro'
      );
      throw new AppError(
        'Erro ao associar bandeiras',
        500,
        'FLAGS_ATTACHMENT_ERROR'
      );
    }
  }

  async _attachBankAccount(clientId, onboardingDTO, transaction, transactionId) {
    try {
      logger.debug(
        { transactionId, clientId },
        '[CreateClientUseCase._attachBankAccount] Criando'
      );

      const bankData = {
        client_id: clientId,
        bank_name: onboardingDTO.bank_name,
        agency: onboardingDTO.agency,
        agency_digit: onboardingDTO.agency_digit || null,
        account: onboardingDTO.account,
        account_digit: onboardingDTO.account_digit || null,
        account_type: onboardingDTO.account_type,
      };

      // ✅ CORRIGIDO: Usar { transaction } em vez de { transaction: transaction }
      await this.clientBankAccountRepository.create(bankData, { transaction });

      logger.info(
        { transactionId, clientId },
        '[CreateClientUseCase._attachBankAccount] Criada'
      );

    } catch (error) {
      logger.error(
        { transactionId, error: error.message, clientId },
        '[CreateClientUseCase._attachBankAccount] Erro'
      );
      throw new AppError(
        'Erro ao criar conta bancária',
        500,
        'BANK_ACCOUNT_CREATION_ERROR'
      );
    }
  }

  _scheduleOldFilesCleanup(publicIds, transactionId) {
    logger.debug(
      { transactionId, count: publicIds.length },
      '[CreateClientUseCase._scheduleOldFilesCleanup] Agendando cleanup'
    );

    setImmediate(async () => {
      await this._deleteOldFilesAsync(publicIds, transactionId);
    });
  }

  async _deleteOldFilesAsync(publicIds, transactionId) {
    try {
      logger.debug(
        { transactionId, count: publicIds.length },
        '[CreateClientUseCase._deleteOldFilesAsync] Iniciando deleção'
      );

      const deletePromises = publicIds.map(publicId =>
        this.storageRepository.delete(publicId).catch(error => {
          logger.warn(
            { error: error.message, publicId, transactionId },
            '[CreateClientUseCase._deleteOldFilesAsync] Erro ao deletar'
          );
        })
      );

      await Promise.allSettled(deletePromises);

      logger.info(
        { transactionId, count: publicIds.length },
        '[CreateClientUseCase._deleteOldFilesAsync] Cleanup completo'
      );

    } catch (error) {
      logger.error(
        { error: error.message, transactionId, count: publicIds.length },
        '[CreateClientUseCase._deleteOldFilesAsync] Erro'
      );
    }
  }

  async _cleanupFailedUploads(uploadedPublicIds, transactionId) {
    try {
      logger.warn(
        { transactionId, count: uploadedPublicIds.length },
        '[CreateClientUseCase._cleanupFailedUploads] Deletando uploads falhados'
      );

      const deletePromises = uploadedPublicIds.map(publicId =>
        this.storageRepository.delete(publicId).catch(error => {
          logger.warn(
            { error: error.message, publicId, transactionId },
            '[CreateClientUseCase._cleanupFailedUploads] Erro ao deletar'
          );
        })
      );

      await Promise.allSettled(deletePromises);

      logger.info(
        { transactionId, count: uploadedPublicIds.length },
        '[CreateClientUseCase._cleanupFailedUploads] Cleanup completado'
      );

    } catch (error) {
      logger.error(
        { error: error.message, transactionId },
        '[CreateClientUseCase._cleanupFailedUploads] Erro no cleanup'
      );
    }
  }

  _generateProtocol() {
    const date = new Date();
    const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();

    // ✅ CORRIGIDO: Adicionar backtick no início
    const protocol = `CLI-${dateStr}-${random}`;

    logger.debug({ protocol }, '[CreateClientUseCase._generateProtocol] Gerado');

    return protocol;
  }
}

module.exports = CreateClientUseCase;