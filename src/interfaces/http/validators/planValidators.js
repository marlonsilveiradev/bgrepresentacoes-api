const yup = require('yup');

// ─── Criar plano ──────────────────────────────────────────────────────────────
const createPlanSchema = yup.object({
  name: yup
    .string()
    .required('Nome do plano é obrigatório.')
    .min(2, 'Nome deve ter no mínimo 2 caracteres.')
    .max(150, 'Nome deve ter no máximo 150 caracteres.')
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
    .max(999999.99, 'Preço inválido.')
    .typeError('Preço deve ser um número.'),

  // Array de UUIDs das bandeiras a vincular — opcional na criação
  flag_ids: yup
    .array()
    .of(
      yup.string().uuid('Cada flag_id deve ser um UUID válido.')
    )
    .optional()
    .default([]),
});

// ─── Atualizar plano ──────────────────────────────────────────────────────────
const updatePlanSchema = yup.object({
  name: yup
    .string()
    .min(2, 'Nome deve ter no mínimo 2 caracteres.')
    .max(150, 'Nome deve ter no máximo 150 caracteres.')
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
    .max(999999.99, 'Preço inválido.')
    .typeError('Preço deve ser um número.')
    .optional(),

  is_active: yup
    .boolean()
    .optional(),

  // Quando enviado, SUBSTITUI completamente as bandeiras do plano
  flag_ids: yup
    .array()
    .of(
      yup.string().uuid('Cada flag_id deve ser um UUID válido.')
    )
    .optional(),
});

// ─── Parâmetro :id ────────────────────────────────────────────────────────────
const planIdParamSchema = yup.object({
  id: yup
    .string()
    .required('ID do plano é obrigatório.')
    .uuid('ID deve ser um UUID válido.'),
});

// ─── Query params listagem ────────────────────────────────────────────────────
const listPlansQuerySchema = yup.object({
  page:      yup.number().integer().min(1).default(1).optional(),
  limit:     yup.number().integer().min(1).max(100).default(20).optional(),
  is_active: yup.boolean().optional(),
  flag_id:   yup.string().uuid('flag_id deve ser um UUID válido.').optional(),
  search:    yup.string().trim().optional(),
});

module.exports = {
  createPlanSchema,
  updatePlanSchema,
  planIdParamSchema,
  listPlansQuerySchema,
};
