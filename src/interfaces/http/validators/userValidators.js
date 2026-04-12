const yup = require('yup');
const { ROLES } = require('../../../shared/constants/roles')
const { cpf: cpfLib } = require('cpf-cnpj-validator');
const { VALID_STATES } = require('./brazilianStates');
const { STRONG_PASSWORD_REGEX, STRONG_PASSWORD_MESSAGE } = require('./authValidators');

// Schema de endereço reutilizável para diminuir repetição
const addressSchema = {
  address_street: yup.string().max(255).trim().optional(),
  address_number: yup.string().max(10).trim().optional(),
  address_complement: yup.string().max(100).trim().optional(),
  address_neighborhood: yup.string().max(100).trim().optional(),
  address_city: yup.string().max(100).trim().optional(),
  address_state: yup.string()
    .uppercase()
    .oneOf(VALID_STATES, 'Estado inválido. Use a sigla (ex: SP)')
    .optional(),
  address_zip: yup.string()
    .matches(/^\d{5}-?\d{3}$/, 'CEP deve estar no formato XXXXX-XXX ou XXXXXXXX')
    .optional(),
};

// ─── Criar usuário (admin) ────────────────────────────────────────────────────
const createUserSchema = yup.object({
  name: yup.string().required('Nome é obrigatório.').min(3).max(150).trim(),
  email: yup.string().required('E-mail é obrigatório.').email().lowercase().trim(),
  role: yup.string().required('Role é obrigatória.').oneOf(Object.values(ROLES)),
  password: yup.string().min(8, STRONG_PASSWORD_MESSAGE).matches(STRONG_PASSWORD_REGEX).optional(),
  cpf: yup.string().optional().test('is-cpf-valid', 'CPF inválido', (v) => !v || cpfLib.isValid(v)),
  ...addressSchema
}).noUnknown(true, 'Campos adicionais não são permitidos').strict();

// ─── Atualizar usuário (admin) ──────────────────────────────────────────────
const updateUserSchema = yup.object({
  name: yup.string().min(3).max(150).trim().optional(),
  email: yup.string().email().lowercase().trim().optional(),
  role: yup.string().oneOf(Object.values(ROLES)).optional(),
  is_active: yup.boolean().optional(),
  password: yup.string().min(8, STRONG_PASSWORD_MESSAGE).matches(STRONG_PASSWORD_REGEX).optional(),
  cpf: yup.string().optional().test('cpf-valid', 'CPF inválido', (v) => !v || cpfLib.isValid(v)),
  ...addressSchema
}).test('at-least-one', 'Forneça ao menos um campo.', (v) => Object.values(v).some(v => v !== undefined))
  .noUnknown(true, 'Campos adicionais não são permitidos').strict();

// ─── Atualizar perfil próprio (user / partner) ────────────────────────────────
const updateProfileSchema = yup.object({
  name: yup.string().min(3).max(150).trim().optional(),
  cpf: yup.string().optional().test('is-cpf-valid', 'CPF inválido', (v) => !v || cpfLib.isValid(v)),
  ...addressSchema
}).test('at-least-one', 'Forneça ao menos um campo.', (v) => Object.values(v).some(v => v !== undefined))
  .noUnknown(true, 'Campos adicionais não são permitidos').strict();

// ─── Alterar senha própria via perfil ──────────────────────────────────────────
const changeOwnPasswordSchema = yup.object({
  currentPassword: yup.string().required('Senha atual é obrigatória.').min(8, 'Senha deve ter no mínimo 8 caracteres.'),
  newPassword: yup.string().required('Nova senha é obrigatória.')
    .min(8, 'A nova senha deve ter pelo menos 8 caracteres.')
    .matches(STRONG_PASSWORD_REGEX, STRONG_PASSWORD_MESSAGE)
    .test('not-same', 'Nova senha não pode ser igual à senha atual.', function (v) {
      return v !== this.parent.currentPassword;
    }),
}).noUnknown(true, 'Campos adicionais não são permitidos').strict();

// ─── Parâmetro :id ────────────────────────────────────────────────────────────
const userIdParamSchema = yup.object({
  id: yup.string().required('ID do usuário é obrigatório.').uuid('ID deve ser um UUID válido.'),
});

// ─── Query params listagem ────────────────────────────────────────────────────
const listUsersQuerySchema = yup.object({
  page: yup.number().integer().min(1).default(1).optional(),
  limit: yup.number().integer().min(1).max(100).default(20).optional(),
  role: yup.string().oneOf(Object.values(ROLES)).optional(),
  is_active: yup.boolean().optional(),
  search: yup.string().trim().optional(),
});

// ─── Exportar todos os schemas ─────────────────────────────────────────────────
module.exports = {
  createUserSchema,
  updateUserSchema,
  updateProfileSchema,
  changeOwnPasswordSchema,
  userIdParamSchema,
  listUsersQuerySchema,
};