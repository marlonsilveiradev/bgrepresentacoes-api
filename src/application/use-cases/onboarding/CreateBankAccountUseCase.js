/**
 * USE CASE: Criar Conta Bancária
 * Cria conta bancária para o cliente
 */

const { ClientBankAccount } = require('../../../infrastructure/repositories/models');

class CreateBankAccountUseCase {
  async execute(clientId, bankData, transaction) {
    const bankAccount = await ClientBankAccount.create(
      {
        client_id: clientId,
        bank_code: bankData.bank_code,
        bank_name: bankData.bank_name,
        agency: bankData.agency,
        agency_digit: bankData.agency_digit,
        account: bankData.account,
        account_digit: bankData.account_digit,
        account_type: bankData.account_type,
      },
      { transaction }
    );

    return bankAccount;
  }
}

module.exports = CreateBankAccountUseCase;