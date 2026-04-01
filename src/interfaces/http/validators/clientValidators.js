const yup = require('yup');

// ─── Helpers ──────────────────────────────────────────────────────────────────
const CNPJ_REGEX = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/;
const ZIP_REGEX = /^\d{5}-?\d{3}$/;
const UF_LIST = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
];

// ─── Criar cliente ────────────────────────────────────────────────────────────
const createClientSchema = yup.object({
  // Dados da empresa
  corporate_name: yup
    .string()
    .required('Razão social é obrigatória.')
    .max(200, 'Razão social deve ter no máximo 200 caracteres.')
    .trim(),

  trade_name: yup
    .string()
    .max(200, 'Nome fantasia deve ter no máximo 200 caracteres.')
    .trim()
    .nullable()
    .optional(),

  cnpj: yup
    .string()
    .required('CNPJ é obrigatório.'),

  phone: yup
    .string()
    .max(11, 'Telefone deve ter no máximo 11 caracteres.')
    .trim()
    .nullable()
    .optional(),

  email: yup
    .string()
    .email('Informe um e-mail válido.')
    .lowercase()
    .trim()
    .nullable()
    .optional(),

  // Endereço
  address_street: yup
    .string()
    .max(255)
    .trim()
    .nullable()
    .optional(),

  address_number: yup
    .string()
    .max(10)
    .trim()
    .nullable()
    .optional(),

  address_complement: yup
    .string()
    .max(100)
    .trim()
    .nullable()
    .optional(),

  address_neighborhood: yup
    .string()
    .max(100)
    .trim()
    .nullable()
    .optional(),

  address_city: yup
    .string()
    .max(100)
    .trim()
    .nullable()
    .optional(),

  address_state: yup
    .string()
    .length(2, 'Estado deve ter exatamente 2 letras (UF).')
    .uppercase()
    .oneOf(UF_LIST, 'UF inválida.')
    .nullable()
    .optional(),

  address_zip: yup
    .string()
    .nullable()
    .optional(),

  // Benefício
  benefit_type: yup
    .string()
    .required('Tipo de benefício é obrigatório.')
    .oneOf(['food', 'meal', 'both'], 'Tipo inválido. Use: food, meal ou both.'),

  notes: yup
    .string()
    .max(2000)
    .trim()
    .nullable()
    .optional(),

  // Vínculo com parceiro (admin define; user ignora)
  partner_id: yup
    .string()
    .uuid('partner_id deve ser um UUID válido.')
    .nullable()
    .optional(),

  // Bandeiras iniciais (opcional — podem ser adicionadas depois)
  flag_ids: yup
    .array()
    .of(yup.string().uuid('Cada flag_id deve ser um UUID válido.'))
    .optional()
    .default([]),
});

// ─── Atualizar cliente ────────────────────────────────────────────────────────
const updateClientSchema = yup.object({
  corporate_name: yup
    .string()
    .max(200)
    .trim()
    .optional(),

  trade_name: yup
    .string()
    .max(200)
    .trim()
    .nullable()
    .optional(),

  cnpj: yup
    .string()
    .matches(CNPJ_REGEX, 'CNPJ deve estar no formato 00.000.000/0000-00.')
    .optional(),

  state_registration: yup.string().max(20).trim().nullable().optional(),
  
  responsible_name: yup
    .string()
    .max(200)
    .trim()
    .required('O nome do responsável é obrigatório.'),

  phone: yup
    .string()
    .max(20)
    .trim()
    .nullable()
    .optional(),

  email: yup
    .string()
    .email('Informe um e-mail válido.')
    .lowercase()
    .trim()
    .nullable()
    .optional(),

  address_street: yup.string().max(255).trim().nullable().optional(),
  address_number: yup.string().max(10).trim().nullable().optional(),
  address_complement: yup.string().max(100).trim().nullable().optional(),
  address_neighborhood: yup.string().max(100).trim().nullable().optional(),
  address_city: yup.string().max(100).trim().nullable().optional(),

  address_state: yup
    .string()
    .length(2, 'UF deve ter exatamente 2 letras.')
    .uppercase()
    .oneOf(UF_LIST, 'UF inválida.')
    .nullable()
    .optional(),

  address_zip: yup
    .string()
    .matches(ZIP_REGEX, 'CEP deve estar no formato 00000-000.')
    .nullable()
    .optional(),

  benefit_type: yup
    .string()
    .oneOf(['food', 'meal', 'both'], 'Tipo inválido.')
    .optional(),

  notes: yup
    .string()
    .max(2000)
    .trim()
    .nullable()
    .optional(),

  partner_id: yup
    .string()
    .uuid('partner_id deve ser um UUID válido.')
    .nullable()
    .optional(),

  bankAccount: yup.object({
    bank_code: yup.string().max(10).trim().nullable().optional(),
    bank_name: yup.string().max(100).trim().nullable().optional(),
    agency: yup.string().max(20).trim().nullable().optional(),
    agency_digit: yup.string().max(5).trim().nullable().optional(),
    account: yup.string().max(20).trim().nullable().optional(),
    account_digit: yup.string().max(5).trim().nullable().optional(),
    account_type: yup.string().oneOf(['checking', 'savings'], 'Tipo de conta inválido.').optional(),
  }).nullable().optional(),

});

// ─── Parâmetro :id ────────────────────────────────────────────────────────────
const clientIdParamSchema = yup.object({
  id: yup
    .string()
    .required('ID do cliente é obrigatório.')
    .uuid('ID deve ser um UUID válido.'),
});

// ─── Query params listagem ────────────────────────────────────────────────────
const listClientsQuerySchema = yup.object({
  page: yup.number().integer().min(1).default(1).optional(),
  limit: yup.number().integer().min(1).max(100).default(20).optional(),
  overall_status: yup.string().oneOf(['pending', 'analysis', 'approved']).optional(),
  benefit_type: yup.string().oneOf(['food', 'meal', 'both']).optional(),
  partner_id: yup.string().uuid().optional(),
  search: yup.string().trim().optional(),
});

module.exports = {
  createClientSchema,
  updateClientSchema,
  clientIdParamSchema,
  listClientsQuerySchema,
};
