const { Router } = require('express');
const yup = require('yup');

const SaleController = require('../../http/controllers/SaleController');
const { authMiddleware, authorize } = require('../../http/middlewares/authMiddleware');
const { defaultLimiter } = require('../../http/middlewares/rateLimiter');
const { validate } = require('../../http/middlewares/validationMiddleware');

const {
  createSaleSchema,
  updateSaleStatusSchema,
  cancelSaleSchema,
  saleIdParamSchema,
  listSalesQuerySchema,
} = require('../../http/validators/saleValidators');

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Sales
 *   description: Gerenciamento de Vendas e Vincular ao Cliente
 */

// ✅ Autenticação obrigatória em todas as rotas
router.use(authMiddleware);

/**
 * @swagger
 * /sales:
 *   get:
 *     summary: Lista vendas com paginação e filtros
 *     description: |
 *       Retorna a lista de vendas baseada na role do usuário:
 *       - **Admin**: visualiza TODAS as vendas
 *       - **User**: visualiza apenas vendas que criou (sold_by = seu ID)
 *       - **Partner**: visualiza apenas vendas vinculadas ao seu partner_id
 *       
 *       Filtros disponíveis:
 *       - page: número da página (default: 1)
 *       - limit: registros por página (default: 20, máx: 100)
 *       - status: pending | analysis | approved | cancelled
 *       - client_id: filtrar por cliente
 *       - sold_by: filtrar por vendedor (apenas admin)
 *       - plan_id: filtrar por plano
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1, minimum: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20, minimum: 1, maximum: 100 }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [pending, analysis, approved, cancelled] }
 *       - in: query
 *         name: client_id
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: sold_by
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: plan_id
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Lista paginada de vendas com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                 pagination:
 *                   type: object
 *       400:
 *         description: "Filtro inválido (strict mode ativado)"
 *       401:
 *         description: "Não autenticado"
 *       403:
 *         description: "Acesso negado por papel"
 */
router.get(
  '/',
  defaultLimiter,
  authorize('admin', 'user', 'partner'),
  validate(listSalesQuerySchema, 'query'),
  SaleController.list
);

/**
 * @swagger
 * /sales/{id}:
 *   get:
 *     summary: Retorna os detalhes completos de uma venda
 *     description: |
 *       Retorna os dados completos da venda incluindo:
 *       - Cliente (protocol, corporate_name, cnpj, overall_status)
 *       - Plano (name, price)
 *       - Vendedor (name, email)
 *       - Partner (name, email)
 *       - Bandeiras da venda (flag_ids, preços, status)
 *       
 *       Controle de acesso:
 *       - Admin: acessa qualquer venda
 *       - User: apenas vendas que criou (sold_by = seu ID)
 *       - Partner: apenas vendas vinculadas ao seu partner_id
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Dados completos da venda com relações
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Venda não pertence ao usuário autenticado
 *       404:
 *         description: Venda não encontrada
 *       422:
 *         description: ID inválido
 */
router.get(
  '/:id',
  defaultLimiter,
  authorize('admin', 'user', 'partner'),
  validate(saleIdParamSchema, 'params'),
  SaleController.getById
);

/**
 * @swagger
 * /sales:
 *   post:
 *     summary: Registra uma nova venda e vincula ao cliente
 *     description: |
 *       Cria uma nova venda e associa automaticamente as bandeiras ao cliente.
 *       
 *       **Regras de Negócio:**
 *       
 *       1. **Cliente**: OBRIGATÓRIO (UUID válido)
 *          - Cliente deve existir no banco
 *          - User deve ter permissão para criar vendas para este cliente
 *       
 *       2. **Plano vs Bandeiras**:
 *          - Se **plan_id** for informado:
 *            • Venda "combo" (preço baseado no plano)
 *            • Bandeiras herdadas automaticamente do plano
 *            • flag_ids pode estar vazio
 *          
 *          - Se **plan_id** for nulo:
 *            • Venda "avulsa" (preço = soma das bandeiras)
 *            • **flag_ids OBRIGATÓRIO** (mínimo 1 bandeira)
 *       
 *       3. **Preços**: Congelados no momento da venda (imutáveis)
 *       
 *       4. **Cliente - Vínculo de Bandeiras**:
 *          • As bandeiras são automaticamente vinculadas ao cliente
 *          • Status das bandeiras do cliente é atualizado
 *          • overall_status do cliente é recalculado
 *       
 *       **Validação Strict Mode:**
 *       - Campos não permitidos: status, sold_by, approved_at, approved_by, etc.
 *       - Isso garante que APENAS dados de negócio são aceitos
 *     
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [client_id]
 *             properties:
 *               client_id:
 *                 type: string
 *                 format: uuid
 *                 description: ID do cliente (obrigatório)
 *               plan_id:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *                 description: ID do plano (opcional, null para venda avulsa)
 *               flag_ids:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 description: Array de IDs de bandeiras (obrigatório se plan_id for nulo)
 *               notes:
 *                 type: string
 *                 maxLength: 2000
 *                 description: Observações adicionais (opcional)
 *     responses:
 *       201:
 *         description: Venda registrada com sucesso e bandeiras vinculadas ao cliente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *       400:
 *         description: Dados inválidos ou campo não permitido (strict mode)
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Sem permissão para criar venda para este cliente
 *       404:
 *         description: Cliente, plano ou bandeira não encontrado
 *       422:
 *         description: "Lógica de negócio violada (ex: plan_id e flag_ids ambos vazios)"
 */
router.post(
  '/',
  defaultLimiter,
  authorize('admin', 'user'),
  validate(createSaleSchema),
  SaleController.create
);

/**
 * @swagger
 * /sales/{id}/status:
 *   patch:
 *     summary: Atualiza o status de uma venda (somente admin)
 *     description: |
 *       Permite que APENAS administradores atualizem o status de uma venda.
 *       
 *       **Estados Válidos:**
 *       - pending → análise, aprovação ou cancelamento
 *       - analysis → aprovação ou cancelamento
 *       - approved → final (não pode ser alterado)
 *       - cancelled → final (não pode ser alterado)
 *       
 *       **Efeito Colateral:**
 *       - Ao atualizar status → overall_status do cliente é recalculado
 *       - Transação atomática garante consistência
 *       
 *       **Validação Strict Mode:**
 *       - Apenas 'status' e 'notes' são permitidos
 *       - Campos como 'sold_by', 'approved_by' são rejeitados
 *     
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, analysis, approved, cancelled]
 *                 description: Novo status da venda
 *               notes:
 *                 type: string
 *                 maxLength: 2000
 *                 description: Anotações da mudança (opcional)
 *     responses:
 *       200:
 *         description: Status atualizado com sucesso
 *       400:
 *         description: Dados inválidos ou campo não permitido (strict mode)
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Somente admin pode alterar status de vendas
 *       404:
 *         description: Venda não encontrada
 *       409:
 *         description: Transição de status não permitida
 *       422:
 *         description: Status inválido
 */
router.patch(
  '/:id/status',
  defaultLimiter,
  authorize('admin'),
  validate(saleIdParamSchema, 'params'),
  validate(updateSaleStatusSchema),
  SaleController.updateStatus
);

/**
 * @swagger
 * /sales/{id}/cancel:
 *   post:
 *     summary: Cancela uma venda
 *     description: |
 *       Cancela uma venda em andamento.
 *       
 *       **Regras de Cancelamento:**
 *       - **Admin**: pode cancelar qualquer venda em status pending ou analysis
 *       - **User**: pode cancelar apenas vendas que criou (sold_by = seu ID)
 *       - Vendas com status 'approved' NÃO podem ser canceladas
 *       - Vendas com status 'cancelled' já estão canceladas
 *       
 *       **Efeito Colateral:**
 *       - Ao cancelar → overall_status do cliente é recalculado
 *       - Bandeiras da venda mantêm seu vínculo ao cliente
 *       - Transação atomática garante consistência
 *       
 *       **Validação Strict Mode:**
 *       - Apenas 'notes' é permitido no body
 *     
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notes:
 *                 type: string
 *                 maxLength: 2000
 *                 description: Motivo do cancelamento (opcional)
 *     responses:
 *       200:
 *         description: Venda cancelada com sucesso
 *       400:
 *         description: Dados inválidos ou campo não permitido (strict mode)
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Sem permissão para cancelar esta venda
 *       404:
 *         description: Venda não encontrada
 *       409:
 *         description: Venda approved ou já cancelada não pode ser cancelada
 *       422:
 *         description: Dados inválidos
 */
router.post(
  '/:id/cancel',
  defaultLimiter,
  authorize('admin', 'user'),
  validate(saleIdParamSchema, 'params'),
  validate(cancelSaleSchema),
  SaleController.cancel
);

module.exports = router;