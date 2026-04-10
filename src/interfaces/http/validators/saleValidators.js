const yup = require('yup');

/**
 * VALIDAÇÃO DE VENDAS - Clean Architecture
 * 
 * ✅ IMPLEMENTAÇÕES:
 * - .strict(true).noUnknown(true) em todos os schemas para rejeitar campos não declarados
 * - Validação de combinações (plan_id + flag_ids) na lógica de negócio (UseCase)
 * - UUIDs válidos obrigatoriamente
 * - Limites de tamanho em strings de texto livre
 * - Melhor documentação dos campos
 */

// ─── CONSTANTES ──────────────────────────────────────────────────────────────

const VALID_STATUSES = ['pending', 'analysis', 'approved', 'cancelled'];
const MAX_NOTES_LENGTH = 2000;

// ─── Criar venda ──────────────────────────────────────────────────────────────

/**
 * Schema de criação de venda
 * 
 * REGRAS DE NEGÓCIO:
 * - client_id: OBRIGATÓRIO (UUID)
 * - plan_id: OPCIONAL
 *   • Se informado → venda "combo" (preço do plano + bandeiras herdadas)
 *   • Se nulo → venda "avulsa" (soma dos preços das bandeiras em flag_ids)
 * - flag_ids: OPCIONAL
 *   • Se plan_id vazio → DEVE ter ao menos 1 bandeira
 *   • Se plan_id informado → pode estar vazio (usa bandeiras do plano)
 * - notes: OPCIONAL (máx 2000 caracteres)
 * 
 * OBSERVAÇÃO: Validação de "plan_id + flag_ids" ocorre na UseCase, não aqui.
 */
const createSaleSchema = yup
  .object({
    client_id: yup
      .string()
      .required('ID do cliente é obrigatório.')
      .uuid('client_id deve ser um UUID válido.'),

    plan_id: yup
      .string()
      .uuid('plan_id deve ser um UUID válido.')
      .nullable()
      .typeError('plan_id deve ser uma string ou null.')
      .optional(),

    flag_ids: yup
      .array()
      .of(
        yup
          .string()
          .uuid('Cada flag_id deve ser um UUID válido.')
          .required('flag_ids não pode conter valores vazios.')
      )
      .typeError('flag_ids deve ser um array de strings.')
      .optional()
      .default([]),

    notes: yup
      .string()
      .max(MAX_NOTES_LENGTH, `Observações devem ter no máximo ${MAX_NOTES_LENGTH} caracteres.`)
      .trim()
      .nullable()
      .typeError('notes deve ser uma string ou null.')
      .optional(),
  })
  .strict(true)
  .noUnknown(true, 'Campo não permitido: ${unknown}');

// ─── Atualizar status da venda (admin only) ───────────────────────────────────

/**
 * Schema para atualizar status de uma venda
 * 
 * REGRAS DE NEGÓCIO:
 * - status: OBRIGATÓRIO (pending | analysis | approved | cancelled)
 * - notes: OPCIONAL (máx 2000 caracteres)
 * 
 * OBSERVAÇÃO: Apenas ADMIN pode atualizar status (validado no middleware + UseCase)
 */
const updateSaleStatusSchema = yup
  .object({
    status: yup
      .string()
      .required('Status é obrigatório.')
      .oneOf(
        VALID_STATUSES,
        `Status inválido. Use: ${VALID_STATUSES.join(', ')}.`
      ),

    notes: yup
      .string()
      .max(MAX_NOTES_LENGTH, `Observações devem ter no máximo ${MAX_NOTES_LENGTH} caracteres.`)
      .trim()
      .nullable()
      .typeError('notes deve ser uma string ou null.')
      .optional(),
  })
  .strict(true)
  .noUnknown(true, 'Campo não permitido: ${unknown}');

// ─── Cancelar venda ───────────────────────────────────────────────────────────

/**
 * Schema para cancelar uma venda
 * 
 * REGRAS DE NEGÓCIO:
 * - notes (motivo): OPCIONAL
 * - Apenas vendedor (sold_by) ou ADMIN podem cancelar (validado na UseCase)
 * - Vendas aprovadas não podem ser canceladas (validado na UseCase)
 */
const cancelSaleSchema = yup
  .object({
    notes: yup
      .string()
      .max(MAX_NOTES_LENGTH, `Motivo deve ter no máximo ${MAX_NOTES_LENGTH} caracteres.`)
      .trim()
      .nullable()
      .typeError('notes deve ser uma string ou null.')
      .optional(),
  })
  .strict(true)
  .noUnknown(true, 'Campo não permitido: ${unknown}');

// ─── Parâmetro :id ────────────────────────────────────────────────────────────

/**
 * Schema para validação do parâmetro ID em rotas dinâmicas
 * Exemplo: GET /sales/:id
 */
const saleIdParamSchema = yup.object({
  id: yup
    .string()
    .required('ID da venda é obrigatório.')
    .uuid('ID deve ser um UUID válido.')
    .typeError('ID deve ser uma string.'),
});

// ─── Query params listagem ────────────────────────────────────────────────────

/**
 * Schema para filtros na listagem de vendas
 * 
 * FILTROS DISPONÍVEIS:
 * - page: número da página (default: 1)
 * - limit: registros por página (default: 20, máx: 100)
 * - status: filtrar por status
 * - client_id: filtrar por cliente
 * - sold_by: filtrar por vendedor (apenas ADMIN)
 * - plan_id: filtrar por plano
 * 
 * OBSERVAÇÃO: Controle de acesso (sold_by, partner_id) ocorre na UseCase
 */
const listSalesQuerySchema = yup
  .object({
    page: yup
      .number()
      .integer('Página deve ser um número inteiro.')
      .min(1, 'Página deve ser no mínimo 1.')
      .default(1)
      .typeError('page deve ser um número.')
      .optional(),

    limit: yup
      .number()
      .integer('Limite deve ser um número inteiro.')
      .min(1, 'Limite deve ser no mínimo 1.')
      .max(100, 'Limite pode ter no máximo 100 registros.')
      .default(20)
      .typeError('limit deve ser um número.')
      .optional(),

    status: yup
      .string()
      .oneOf(
        VALID_STATUSES,
        `Status inválido. Use: ${VALID_STATUSES.join(', ')}.`
      )
      .optional(),

    client_id: yup
      .string()
      .uuid('client_id deve ser um UUID válido.')
      .typeError('client_id deve ser uma string.')
      .optional(),

    sold_by: yup
      .string()
      .uuid('sold_by deve ser um UUID válido.')
      .typeError('sold_by deve ser uma string.')
      .optional(),

    plan_id: yup
      .string()
      .uuid('plan_id deve ser um UUID válido.')
      .typeError('plan_id deve ser uma string.')
      .optional(),
  })
  .strict(true)
  .noUnknown(true, 'Filtro não permitido: ${unknown}');

// ─── EXPORTS ───────────────────────────────────────────────────────────────────

module.exports = {
  createSaleSchema,
  updateSaleStatusSchema,
  cancelSaleSchema,
  saleIdParamSchema,
  listSalesQuerySchema,
};