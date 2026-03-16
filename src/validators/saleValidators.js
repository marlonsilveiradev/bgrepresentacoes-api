const yup = require('yup');

/**
 * .strict(true).noUnknown(true) em todos os schemas:
 * → Rejeita qualquer campo não declarado no schema com erro 422.
 * → Impede injeção de campos como 'status', 'sold_by', 'approved_at', etc.
 */

// ─── Criar venda ──────────────────────────────────────────────────────────────
const createSaleSchema = yup
  .object({
    client_id: yup
      .string()
      .required('Cliente é obrigatório.')
      .uuid('client_id deve ser um UUID válido.'),

    // Opcional: se informado → Combo (total = preço do plano, bandeiras herdadas automaticamente)
    //           se nulo     → Avulso (total = soma dos preços das bandeiras em flag_ids)
    plan_id: yup
      .string()
      .uuid('plan_id deve ser um UUID válido.')
      .nullable()
      .optional(),

    // Opcional quando plan_id é informado — o sistema busca as bandeiras do plano automaticamente.
    // Obrigatório (min 1) apenas em vendas avulsas (sem plan_id).
    flag_ids: yup
      .array()
      .of(yup.string().uuid('Cada flag_id deve ser um UUID válido.'))
      .optional()
      .default([]),

    notes: yup
      .string()
      .max(2000, 'Observações devem ter no máximo 2000 caracteres.')
      .trim()
      .nullable()
      .optional(),
  })
  .strict(true)
  .noUnknown(true, 'Campo não permitido: ${unknown}');

// ─── Atualizar status da venda (admin) ────────────────────────────────────────
const updateSaleStatusSchema = yup
  .object({
    status: yup
      .string()
      .required('Status é obrigatório.')
      .oneOf(
        ['pending', 'analysis', 'approved', 'cancelled'],
        'Status inválido. Use: pending, analysis, approved ou cancelled.'
      ),

    notes: yup
      .string()
      .max(2000)
      .trim()
      .nullable()
      .optional(),
  })
  .strict(true)
  .noUnknown(true, 'Campo não permitido: ${unknown}');

// ─── Cancelar venda ───────────────────────────────────────────────────────────
const cancelSaleSchema = yup
  .object({
    notes: yup
      .string()
      .max(2000, 'Motivo deve ter no máximo 2000 caracteres.')
      .trim()
      .nullable()
      .optional(),
  })
  .strict(true)
  .noUnknown(true, 'Campo não permitido: ${unknown}');

// ─── Parâmetro :id ────────────────────────────────────────────────────────────
const saleIdParamSchema = yup.object({
  id: yup
    .string()
    .required('ID da venda é obrigatório.')
    .uuid('ID deve ser um UUID válido.'),
});

// ─── Query params listagem ────────────────────────────────────────────────────
const listSalesQuerySchema = yup
  .object({
    page:      yup.number().integer().min(1).default(1).optional(),
    limit:     yup.number().integer().min(1).max(100).default(20).optional(),
    status:    yup.string().oneOf(['pending', 'analysis', 'approved', 'cancelled']).optional(),
    client_id: yup.string().uuid().optional(),
    sold_by:   yup.string().uuid().optional(),
    plan_id:   yup.string().uuid().optional(),
  })
  .strict(true)
  .noUnknown(true, 'Filtro não permitido: ${unknown}');

module.exports = {
  createSaleSchema,
  updateSaleStatusSchema,
  cancelSaleSchema,
  saleIdParamSchema,
  listSalesQuerySchema,
};
