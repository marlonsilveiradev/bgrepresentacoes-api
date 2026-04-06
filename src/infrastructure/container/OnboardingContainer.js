/**
 * CONTAINER: Onboarding Dependencies
 * 
 * Injeção de dependências centralizada para Onboarding
 * Responsabilidade: Instanciar e injetar todos os use cases atômicos
 * 
 * Padrão: Dependency Injection
 * Benefício: Fácil mockar em testes, centralizar dependências
 */

const { UserRepository, RefreshTokenRepository } = require('../repositories');
const {
  ValidatePlanOrFlagsUseCase,
  CreateClientUseCase,
  CreateBankAccountUseCase,
  CreateSaleUseCase,
  AssociateFlagsUseCase,
  ProcessDocumentsUseCase,
  OnboardClientUseCase,
} = require('../../application/use-cases/onboarding');

class OnboardingContainer {
  constructor() {
    // ═══════════════════════════════════════════════════════════
    // INSTANCIAR REPOSITÓRIOS (singleton)
    // ═══════════════════════════════════════════════════════════
    this.userRepository = new UserRepository();
    this.refreshTokenRepository = new RefreshTokenRepository();

    // ═══════════════════════════════════════════════════════════
    // INSTANCIAR USE CASES ATÔMICOS (singleton)
    // ═══════════════════════════════════════════════════════════

    /**
     * USE CASE: Validar Plano ou Bandeiras
     * Dependências: nenhuma (queries ao BD via models diretamente)
     */
    this.validatePlanOrFlagsUseCase = new ValidatePlanOrFlagsUseCase();

    /**
     * USE CASE: Criar Cliente
     * Dependências: nenhuma (queries ao BD via models diretamente)
     */
    this.createClientUseCase = new CreateClientUseCase();

    /**
     * USE CASE: Criar Conta Bancária
     * Dependências: nenhuma (queries ao BD via models diretamente)
     */
    this.createBankAccountUseCase = new CreateBankAccountUseCase();

    /**
     * USE CASE: Criar Venda
     * Dependências: nenhuma (queries ao BD via models diretamente)
     */
    this.createSaleUseCase = new CreateSaleUseCase();

    /**
     * USE CASE: Associar Bandeiras
     * Dependências: nenhuma (queries ao BD via models diretamente)
     */
    this.associateFlagsUseCase = new AssociateFlagsUseCase();

    /**
     * USE CASE: Processar Documentos
     * Dependências: StorageService (upload para Cloudinary)
     */
    this.processDocumentsUseCase = new ProcessDocumentsUseCase();

    /**
     * USE CASE: Onboard Client (MAESTRIA)
     * Orquestra todos os use cases atômicos acima
     * Dependências: Todos os use cases atômicos
     */
    this.onboardClientUseCase = new OnboardClientUseCase();
  }

  // ═══════════════════════════════════════════════════════════
  // GETTERS: Recuperar use cases
  // ═══════════════════════════════════════════════════════════

  /**
   * Obter use case principal de onboarding
   * @returns {OnboardClientUseCase}
   */
  getOnboardClientUseCase() {
    return this.onboardClientUseCase;
  }

  /**
   * Obter use case de validação
   * @returns {ValidatePlanOrFlagsUseCase}
   */
  getValidatePlanOrFlagsUseCase() {
    return this.validatePlanOrFlagsUseCase;
  }

  /**
   * Obter use case de criação de cliente
   * @returns {CreateClientUseCase}
   */
  getCreateClientUseCase() {
    return this.createClientUseCase;
  }

  /**
   * Obter use case de criação de conta bancária
   * @returns {CreateBankAccountUseCase}
   */
  getCreateBankAccountUseCase() {
    return this.createBankAccountUseCase;
  }

  /**
   * Obter use case de criação de venda
   * @returns {CreateSaleUseCase}
   */
  getCreateSaleUseCase() {
    return this.createSaleUseCase;
  }

  /**
   * Obter use case de associação de bandeiras
   * @returns {AssociateFlagsUseCase}
   */
  getAssociateFlagsUseCase() {
    return this.associateFlagsUseCase;
  }

  /**
   * Obter use case de processamento de documentos
   * @returns {ProcessDocumentsUseCase}
   */
  getProcessDocumentsUseCase() {
    return this.processDocumentsUseCase;
  }
}

// ═══════════════════════════════════════════════════════════
// EXPORTAR SINGLETON
// ═══════════════════════════════════════════════════════════

module.exports = new OnboardingContainer();