/**
 * CONTAINER: Onboarding
 * 
 * Responsabilidade: Injetar TODAS as dependências para onboarding
 * 
 * ✅ AGORA COM:
 * - clientDocumentRepository (NOVO!)
 * - storageRepository (NOVO!)
 * - ProcessClientDocumentsUseCase
 * - CreateClientUseCase
 */

const CreateClientUseCase = require('../../application/use-cases/onboarding/CreateClientUseCase');
const ProcessClientDocumentsUseCase = require('../../application/use-cases/onboarding/ProcessClientDocumentsUseCase');
const StorageRepository = require('../repositories/StorageRepository');
const logger = require('../config/logger');

class OnboardingContainer {
  constructor(
    clientRepository,
    planRepository,
    flagRepository,
    clientFlagRepository,
    clientBankAccountRepository,
    clientDocumentRepository,  // ✅ ADICIONADO
    sequelize
  ) {
    this.clientRepository = clientRepository;
    this.planRepository = planRepository;
    this.flagRepository = flagRepository;
    this.clientFlagRepository = clientFlagRepository;
    this.clientBankAccountRepository = clientBankAccountRepository;
    this.clientDocumentRepository = clientDocumentRepository;  // ✅ ARMAZENADO
    this.sequelize = sequelize;

    // ✅ Instanciar StorageRepository
    this.storageRepository = new StorageRepository();

    logger.info(
      '[OnboardingContainer] Inicializado com TODAS as dependências'
    );
  }

  /**
   * Obter ProcessClientDocumentsUseCase
   */
  getProcessClientDocumentsUseCase() {
    return new ProcessClientDocumentsUseCase(
      this.clientDocumentRepository,  // ✅ AGORA INJETADO
      this.storageRepository
    );
  }

  /**
   * Obter CreateClientUseCase com TODAS as dependências
   */
  getCreateClientUseCase() {
    return new CreateClientUseCase(
      this.clientRepository,
      this.planRepository,
      this.flagRepository,
      this.clientFlagRepository,
      this.clientBankAccountRepository,
      this.clientDocumentRepository,  // ✅ ADICIONADO
      this.getProcessClientDocumentsUseCase(),
      this.storageRepository,  // ✅ ADICIONADO
      this.sequelize
    );
  }
}

module.exports = OnboardingContainer;