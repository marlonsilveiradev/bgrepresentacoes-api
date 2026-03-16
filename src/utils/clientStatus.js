// src/utils/clientStatus.js

// Definimos aqui o que o banco de dados entende
const STATUS = {
  PENDING: 'pending',
  ANALYSIS: 'analysis',
  APPROVED: 'approved'
};

const calculateOverallStatus = (clientFlags) => {
  // Se não houver bandeiras, o padrão é pendente
  if (!clientFlags || clientFlags.length === 0) return STATUS.PENDING;

  // Extraímos os status tratando tanto objetos Sequelize quanto JSON puro
  const statuses = clientFlags.map((cf) => cf.status || (cf.dataValues && cf.dataValues.status));

  // 1. Se houver qualquer uma em análise, o status do cliente é ANÁLISE
  if (statuses.includes(STATUS.ANALYSIS)) return STATUS.ANALYSIS;

  // 2. Só fica APROVADO se TODAS estiverem aprovadas
  if (statuses.every((s) => s === STATUS.APPROVED)) return STATUS.APPROVED;

  // 3. Se houver alguma pendente ou mistura, permanece PENDENTE
  return STATUS.PENDING;
};

module.exports = { calculateOverallStatus };