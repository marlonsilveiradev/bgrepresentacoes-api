/**
 * USE CASE: Onboard Client
 * 
 * Orquestra todos os use cases atômicos em uma única transação
 * Esta é a "maestria" que coordena as operações
 */

const { sequelize } = require('../../../infrastructure/repositories/models');
const AppError = require('../../../shared/utils/AppError');
const { OnboardingResultDTO } = require('../../dtos/onboarding');

// Importar use cases
const ValidatePlanOrFlagsUseCase = require('./ValidatePlanOrFlagsUseCase');
const CreateClientUseCase = require('./CreateClientUseCase');
const CreateBankAccountUseCase = require('./CreateBankAccountUseCase');
const CreateSaleUseCase = require('./CreateSaleUseCase');
const AssociateFlagsUseCase = require('./AssociateFlagsUseCase');
const ProcessDocumentsUseCase = require('./ProcessDocumentsUseCase');

class OnboardClientUseCase {
  constructor() {
    // Injetar todos os use cases atômicos
    this.validatePlanOrFlags = new ValidatePlanOrFlagsUseCase();
    this.createClient = new CreateClientUseCase();
    this.createBankAccount = new CreateBankAccountUseCase();
    this.createSale = new CreateSaleUseCase();
    this.associateFlags = new AssociateFlagsUseCase();
    this.processDocuments = new ProcessDocumentsUseCase();
  }

  async execute(requester, onboardDTO, files) {
    // ✅ PASSO 1: Validar plano ou bandeiras (fora da transação)
    const { plan, selectedFlags } = await this.validatePlanOrFlags.execute(
      onboardDTO.plan_id,
      onboardDTO.flag_ids
    );

    // ✅ PASSO 2-7: Executar dentro de TRANSAÇÃO ATÔMICA
    const result = await sequelize.transaction(async (transaction) => {
      // Criar cliente
      const client = await this.createClient.execute(
        requester,
        onboardDTO,
        transaction
      );

      // Criar conta bancária
      const bankAccount = await this.createBankAccount.execute(
        client.id,
        onboardDTO,
        transaction
      );

      // Calcular bandeiras e valor
      const { flags, totalValue } = this._calculateFlagsAndValue(plan, selectedFlags);

      // Criar venda
      const sale = await this.createSale.execute(
        client.id,
        plan,
        totalValue,
        requester.id,
        transaction
      );

      // Associar bandeiras
      await this.associateFlags.execute(
        sale.id,
        client.id,
        flags,
        transaction
      );

      // Processar documentos (fazer upload)
      const documents = await this.processDocuments.execute(
        client.id,
        files,
        requester.id,
        transaction
      );

      return { client, bankAccount, sale, documents, flags };
    });

    // ✅ PASSO 8: Formatar resposta
    return new OnboardingResultDTO(result);
  }

  /**
   * Calcular bandeiras e valor total
   */
  _calculateFlagsAndValue(plan, selectedFlags) {
    if (plan) {
      const flags = plan.flags.map(f => ({
        id: f.id,
        name: f.name,
        price: parseFloat(f.price || 0),
        origin: 'plan',
      }));
      const totalValue = parseFloat(plan.price || 0);
      return { flags, totalValue };
    }

    const flags = selectedFlags.map(f => ({
      id: f.id,
      name: f.name,
      price: parseFloat(f.price || 0),
      origin: 'individual',
    }));
    const totalValue = flags.reduce((sum, f) => sum + f.price, 0);
    return { flags, totalValue };
  }
}

module.exports = OnboardClientUseCase;