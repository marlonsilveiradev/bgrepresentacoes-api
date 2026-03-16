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
});

// ─── Atualizar usuário (admin) ────────────────────────────────────────────────
const updateUserSchema = yup.object({
  name: yup
    .string()
    .min(3, 'Nome deve ter no mínimo 3 caracteres.')
    .max(150)
    .trim()
    .optional(),

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
  (value) => Object.keys(value).length > 0
);;

// ─── Atualizar perfil próprio (user / partner) ────────────────────────────────
// Apenas 'name' é permitido. E-mail, role e is_active são bloqueados aqui
// e também no Service (defesa em profundidade).
const updateProfileSchema = yup.object({
  name: yup
    .string()
    .required('Nome é obrigatório.')
    .min(3, 'Nome deve ter no mínimo 3 caracteres.')
    .max(150, 'Nome deve ter no máximo 150 caracteres.')
    .trim(),
}).noUnknown(true, 'Campos adicionais não são permitidos.').strict();

// ─── Parâmetro :id ────────────────────────────────────────────────────────────
const userIdParamSchema = yup.object({
  id: yup
    .string()
    .required('ID do usuário é obrigatório.')
    .uuid('ID deve ser um UUID válido.'),
});

// ─── Query params listagem ────────────────────────────────────────────────────
const listUsersQuerySchema = yup.object({
  page:      yup.number().integer().min(1).default(1).optional(),
  limit:     yup.number().integer().min(1).max(100).default(20).optional(),
  role:      yup.string().oneOf(['admin', 'user', 'partner']).optional(),
  is_active: yup.boolean().optional(),
  search:    yup.string().trim().optional(),
});

module.exports = {
  createUserSchema,
  updateUserSchema,
  updateProfileSchema,
  userIdParamSchema,
  listUsersQuerySchema,
};
