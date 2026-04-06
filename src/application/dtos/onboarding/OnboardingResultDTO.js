/**
 * DTO: Resultado do Onboarding
 * Formato de resposta HTTP
 */

class OnboardingResultDTO {
  constructor({ client, bankAccount, sale, documents, flags }) {
    this.client = {
      id: client.id,
      protocol: client.protocol,
      corporate_name: client.corporate_name,
      cnpj: client.cnpj,
      responsible_name: client.responsible_name,
      address: client.address,
      overall_status: client.overall_status,
      created_at: client.created_at?.toISOString(),
      bankAccount: {
        bank_name: bankAccount.bank_name,
        agency: bankAccount.agency,
        account: bankAccount.account,
        account_type: bankAccount.account_type,
      },
      bandeiras_contratadas: flags.map(f => ({
        id: f.id,
        name: f.name,
      })),
    };

    this.sale = {
      id: sale.id,
      status: sale.status,
      total_value: parseFloat(sale.total_value).toFixed(2),
      valor_final: parseFloat(sale.total_value).toFixed(2),
      plan_name: sale.plan_name,
      created_at: sale.created_at?.toISOString(),
    };

    this.documents = documents.map(doc => ({
      id: doc.id,
      document_type: doc.document_type,
      original_name: doc.original_name,
      download_url: `/api/v1/documents/${doc.id}/download`,
      created_at: doc.created_at?.toISOString(),
    }));
  }
}

module.exports = OnboardingResultDTO;