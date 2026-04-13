/**
 * DTO mínimo para role PARTNER (data minimization).
 * Apenas: razão social, telefone, nome do plano (sem valores) e status por bandeira.
 */

function _latestPlanName(sales) {
  if (!Array.isArray(sales) || sales.length === 0) {
    return null;
  }
  const name = sales[0].plan_name;
  return name && String(name).trim() ? String(name).trim() : null;
}

function _flagsForPartner(clientFlags) {
  if (!Array.isArray(clientFlags)) {
    return [];
  }
  return clientFlags.map(cf => ({
    name: cf.flag?.name ?? null,
    status: cf.status,
  }));
}

/**
 * @param {object} client - instância Sequelize Client (com .toJSON) ou objeto plain com `flags` / `sales`
 * @returns {object}
 */
function buildPartnerClientView(client) {
  const data = client?.toJSON ? client.toJSON() : client;

  const planName = _latestPlanName(data.sales);

  return {
    corporate_name: data.corporate_name,
    phone: data.phone,
    plan: planName ? { name: planName } : null,
    flags: _flagsForPartner(data.flags),
  };
}

module.exports = { buildPartnerClientView };
