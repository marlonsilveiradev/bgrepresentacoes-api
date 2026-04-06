/**
 * DTO: Onboard Client
 * Recebe e valida os dados crus do HTTP
 */
const AppError = require('../../../shared/utils/AppError');

class OnboardClientDTO {
  constructor({
    // Cliente
    corporate_name,
    trade_name,
    responsible_name,
    cnpj,
    state_registration,
    address,
    // Conta Bancária
    bank_code,
    bank_name,
    agency,
    account,
    account_type,
    // Venda
    plan_id,
    flag_ids,
    partner_id,
  }) {
    this.corporate_name = corporate_name;
    this.trade_name = trade_name;
    this.responsible_name = responsible_name;
    this.cnpj = cnpj;
    this.state_registration = state_registration;
    this.address = address;

    this.bank_code = bank_code;
    this.bank_name = bank_name;
    this.agency = agency;
    this.account = account;
    this.account_type = account_type;

    this.plan_id = plan_id;
    this.flag_ids = flag_ids;
    this.partner_id = partner_id;
  }

  /**
   * Validação básica de estrutura
   */
  static validate(data) {
    if (!data.corporate_name) {
      throw new AppError('Razão social obrigatória', 422);
    }
    if (!data.responsible_name) {
      throw new AppError('Nome do responsável obrigatório', 422);
    }
    if (!data.cnpj) {
      throw new AppError('CNPJ obrigatório', 422);
    }
    if (!data.address) {
      throw new AppError('Endereço obrigatório', 422);
    }

    // Validar plano ou bandeiras
    const hasPlan = data.plan_id && typeof data.plan_id === 'string';
    const hasFlags = Array.isArray(data.flag_ids) && data.flag_ids.length > 0;

    if (!hasPlan && !hasFlags) {
      throw new AppError('Informe um plano ou ao menos uma bandeira', 422);
    }

    return new OnboardClientDTO(data);
  }
}

module.exports = OnboardClientDTO;