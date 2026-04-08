/**
 * CONSTANTS: Estados Brasileiros
 * Lista completa de UFs válidas no Brasil com seus nomes
 * 
 * Usado para validação de formulários de endereço
 */

const BRAZILIAN_STATES = {
  'AC': 'Acre',
  'AL': 'Alagoas',
  'AP': 'Amapá',
  'AM': 'Amazonas',
  'BA': 'Bahia',
  'CE': 'Ceará',
  'DF': 'Distrito Federal',
  'ES': 'Espírito Santo',
  'GO': 'Goiás',
  'MA': 'Maranhão',
  'MT': 'Mato Grosso',
  'MS': 'Mato Grosso do Sul',
  'MG': 'Minas Gerais',
  'PA': 'Pará',
  'PB': 'Paraíba',
  'PR': 'Paraná',
  'PE': 'Pernambuco',
  'PI': 'Piauí',
  'RJ': 'Rio de Janeiro',
  'RN': 'Rio Grande do Norte',
  'RS': 'Rio Grande do Sul',
  'RO': 'Rondônia',
  'RR': 'Roraima',
  'SC': 'Santa Catarina',
  'SP': 'São Paulo',
  'SE': 'Sergipe',
  'TO': 'Tocantins',
};

/**
 * Array de UFs válidas (apenas as chaves)
 * Usado para validação rápida
 */
const VALID_STATES = Object.keys(BRAZILIAN_STATES);

/**
 * Validar se um estado é válido no Brasil
 * 
 * @param {string} state - Estado (ex: 'SP', 'RJ')
 * @returns {boolean} True se válido, false caso contrário
 * 
 * @example
 * isValidBrazilianState('SP') // true
 * isValidBrazilianState('XX') // false
 * isValidBrazilianState('sp') // true (case-insensitive)
 */
const isValidBrazilianState = (state) => {
  if (!state || typeof state !== 'string') return false;
  return VALID_STATES.includes(state.toUpperCase());
};

/**
 * Obter nome completo de um estado pela UF
 * 
 * @param {string} uf - Sigla do estado (ex: 'SP')
 * @returns {string|null} Nome do estado ou null se inválido
 * 
 * @example
 * getStateName('SP') // 'São Paulo'
 * getStateName('XX') // null
 */
const getStateName = (uf) => {
  if (!uf) return null;
  return BRAZILIAN_STATES[uf.toUpperCase()] || null;
};

module.exports = {
  BRAZILIAN_STATES,
  VALID_STATES,
  isValidBrazilianState,
  getStateName,
};