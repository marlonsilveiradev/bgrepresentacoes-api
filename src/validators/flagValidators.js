const yup = require('yup');

// ─── Criar bandeira ───────────────────────────────────────────────────────────
const createFlagSchema = yup.object({
  name: yup
    .string()
    .required('Nome da bandeira é obrigatório.')
    .min(2, 'Nome deve ter no mínimo 2 caracteres.')
    .max(100, 'Nome deve ter no máximo 100 caracteres.')
    .trim(),

  description: yup
    .string()
    .max(500, 'Descrição deve ter no máximo 500 caracteres.')
    .trim()
    .nullable()
    .optional(),

  price: yup
    .number()
    .required('Preço é obrigatório.')
    .min(0.01, 'Preço deve ser maior que zero.')
    .max(99999.99, 'Preço inválido.')
    .typeError('Preço deve ser um número.'),
});

// ─── Atualizar bandeira ───────────────────────────────────────────────────────
const updateFlagSchema = yup.object({
  name: yup
    .string()
    .min(2, 'Nome deve ter no mínimo 2 caracteres.')
    .max(100, 'Nome deve ter no máximo 100 caracteres.')
    .trim()
    .optional(),

  description: yup
    .string()
    .max(500, 'Descrição deve ter no máximo 500 caracteres.')
    .trim()
    .nullable()
    .optional(),

  price: yup
    .number()
    .min(0.01, 'Preço deve ser maior que zero.')
    .max(99999.99, 'Preço inválido.')
    .typeError('Preço deve ser um número.')
    .optional(),

  is_active: yup
    .boolean()
    .optional(),
});

// ─── Parâmetro :id ────────────────────────────────────────────────────────────
const flagIdParamSchema = yup.object({
  id: yup
    .string()
    .required('ID da bandeira é obrigatório.')
    .uuid('ID deve ser um UUID válido.'),
});

// ─── Query params listagem ────────────────────────────────────────────────────
const listFlagsQuerySchema = yup.object({
  page: yup.number().integer().min(1).default(1).optional(),
  limit: yup.number().integer().min(1).max(100).default(20).optional(),
  is_active: yup.boolean().optional(),
  search: yup.string().trim().optional(),
});

module.exports = {
  createFlagSchema,
  updateFlagSchema,
  flagIdParamSchema,
  listFlagsQuerySchema,
};
