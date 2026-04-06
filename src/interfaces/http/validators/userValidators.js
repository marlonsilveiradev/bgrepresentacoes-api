const yup = require('yup');

const { STRONG_PASSWORD_REGEX, STRONG_PASSWORD_MESSAGE } = require('./authValidators');

// ─── Criar usuário (admin) ────────────────────────────────────────────────────
// Sem campo 'password' — o Service gera uma senha temporária automaticamente

const createUserSchema = yup.object({
  name: yup
    .string()
    .required('Nome é obrigatório.')
    .min(3, 'Nome deve ter no mínimo 3 caracteres.')
    .max(150, 'Nome deve ter no máximo 150 caracteres.')
    .trim(),

  email: yup
    .string()
    .required('E-mail é obrigatório.')
    .email('Informe um e-mail válido.')
    .lowercase()
    .trim(),

  role: yup
    .string()
    .required('Papel (role) é obrigatório.')
    .oneOf(['admin', 'user', 'partner'], 'Role inválido. Use: admin, user ou partner.'),
}).noUnknown(true).strict();

// ─── Atualizar usuário (admin) ────────────────────────────────────────────────
// ⚠️ MUDANÇA: Removido campo 'password' — admin não altera senha aqui
// Admin usa /auth/change-password ou o próprio usuário altera via /profile/change-password

const updateUserSchema = yup.object({
  email: yup
    .string()
    .email('Informe um e-mail válido.')
    .lowercase()
    .trim()
    .optional(),

  role: yup
    .string()
    .oneOf(['admin', 'user', 'partner'], 'Role inválido.')
    .optional(),

  is_active: yup
    .boolean()
    .optional(),
}).test(
  'at-least-one-field',
  'Você deve fornecer pelo menos um campo para atualizar.',
  (value) => {
    const fields = Object.values(value).filter(v => v !== undefined);
    return fields.length > 0;
  }
).noUnknown(true, 'Campos adicionais não são permitidos.').strict();

// ─── Atualizar perfil próprio (user / partner) ────────────────────────────────
// ✅ MUDANÇA: Agora inclui cpf e campos de endereço (conforme migration)

const updateProfileSchema = yup.object({
  name: yup
    .string()
    .min(3, 'Nome deve ter no mínimo 3 caracteres.')
    .max(150, 'Nome deve ter no máximo 150 caracteres.')
    .trim()
    .optional(),

  cpf: yup
    .string()
    .matches(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, 'CPF deve estar no formato XXX.XXX.XXX-XX')
    .optional(),

  address_street: yup
    .string()
    .max(255, 'Rua deve ter no máximo 255 caracteres.')
    .trim()
    .optional(),

  address_number: yup
    .string()
    .max(10, 'Número deve ter no máximo 10 caracteres.')
    .trim()
    .optional(),

  address_complement: yup
    .string()
    .max(100, 'Complemento deve ter no máximo 100 caracteres.')
    .trim()
    .optional(),

  address_neighborhood: yup
    .string()
    .max(100, 'Bairro deve ter no máximo 100 caracteres.')
    .trim()
    .optional(),

  address_city: yup
    .string()
    .max(100, 'Cidade deve ter no máximo 100 caracteres.')
    .trim()
    .optional(),

  address_state: yup
    .string()
    .matches(/^[A-Z]{2}$/, 'Estado deve ser sigla de 2 letras (ex: SP, RJ)')
    .optional(),

  address_zip: yup
    .string()
    .matches(/^\d{5}-?\d{3}$/, 'CEP deve estar no formato XXXXX-XXX ou XXXXXXXX')
    .optional(),
}).test(
  'at-least-one-field',
  'Você deve fornecer pelo menos um campo para atualizar.',
  (value) => {
    const fields = Object.values(value).filter(v => v !== undefined);
    return fields.length > 0;
  }
).noUnknown(true, 'Campos adicionais não são permitidos.').strict();

// ─── Alterar senha própria via perfil ──────────────────────────────────────────
// ✅ NOVO: Schema para PATCH /profile/change-password

const changeOwnPasswordSchema = yup.object({
  currentPassword: yup
    .string()
    .required('Senha atual é obrigatória.')
    .min(6, 'Senha deve ter no mínimo 6 caracteres.'),

  newPassword: yup
    .string()
    .required('Nova senha é obrigatória.')
    .min(8, 'A nova senha deve ter pelo menos 8 caracteres.')
    .matches(STRONG_PASSWORD_REGEX, STRONG_PASSWORD_MESSAGE)
    .test(
      'not-same',
      'Nova senha não pode ser igual à senha atual.',
      function (value) {
        return value !== this.parent.currentPassword;
      }
    ),
}).noUnknown(true).strict();

// ─── Parâmetro :id ────────────────────────────────────────────────────────────

const userIdParamSchema = yup.object({
  id: yup
    .string()
    .required('ID do usuário é obrigatório.')
    .uuid('ID deve ser um UUID válido.'),
});

// ─── Query params listagem ────────────────────────────────────────────────────

const listUsersQuerySchema = yup.object({
  page: yup.number().integer().min(1).default(1).optional(),

  limit: yup.number().integer().min(1).max(100).default(20).optional(),

  role: yup.string().oneOf(['admin', 'user', 'partner']).optional(),

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