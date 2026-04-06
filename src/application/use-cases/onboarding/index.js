/**
 * Onboarding Use Cases - Índice centralizado
 */

const OnboardClientUseCase = require('./OnboardClientUseCase');
const ValidatePlanOrFlagsUseCase = require('./ValidatePlanOrFlagsUseCase');
const CreateClientUseCase = require('./CreateClientUseCase');
const CreateBankAccountUseCase = require('./CreateBankAccountUseCase');
const CreateSaleUseCase = require('./CreateSaleUseCase');
const AssociateFlagsUseCase = require('./AssociateFlagsUseCase');
const ProcessDocumentsUseCase = require('./ProcessDocumentsUseCase');

module.exports = {
  OnboardClientUseCase,
  ValidatePlanOrFlagsUseCase,
  CreateClientUseCase,
  CreateBankAccountUseCase,
  CreateSaleUseCase,
  AssociateFlagsUseCase,
  ProcessDocumentsUseCase,
};