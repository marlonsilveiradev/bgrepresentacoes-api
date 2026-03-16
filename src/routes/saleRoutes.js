const { Router } = require('express');
const SaleController = require('../controllers/SaleController');
const { authMiddleware, authorize } = require('../middlewares/authMiddleware');
const { validate } = require('../middlewares/validationMiddleware');
const {
  createSaleSchema,
  updateSaleStatusSchema,
  cancelSaleSchema,
  saleIdParamSchema,
  listSalesQuerySchema,
} = require('../validators/saleValidators');

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Sales
 *   description: Gerenciamento de Vendas
 */
router.use(authMiddleware);


/**
 * @swagger
 * /sales:
 *   get:
 *     summary: Lista vendas com paginação e filtros
 *     description: Retorna a lista de vendas baseada na role do usuário (Admin, User ou Partner).
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [pending, analysis, approved] }
 *     responses:
 *       200:
 *         description: Lista paginada de vendas
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Acesso negado
 */
router.get(
  '/',
  authorize('admin', 'user', 'partner'),
  validate(listSalesQuerySchema, 'query'),
  SaleController.list
);

/**
 * @swagger
 * /sales/{id}:
 *   get:
 *     summary: Retorna uma venda pelo ID
 *     description: Retorna os dados completos da venda incluindo client, plan, seller, partner e saleFlags.
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
 *         description: Dados da venda
 *       403:
 *         description: Venda não pertence ao usuário autenticado
 *       404:
 *         description: Venda não encontrada
 */
router.get(
  '/:id',
  authorize('admin', 'user', 'partner'),
  validate(saleIdParamSchema, 'params'),
  SaleController.getById
);

/**
 * @swagger
 * /sales:
 *   post:
 *     summary: Registra uma nova venda
 *     description: |
 *       Regras de negócio:
 *       Utilize esta rota para clientes que já passaram pelo Onboarding.
 *       - Se informar `plan_id`, o valor é baseado no plano.
 *       - Se `plan_id` for nulo, o valor é a soma das `flag_ids`.
 *       - Os preços das bandeiras são congelados no momento da venda (imutáveis)
 *     tags: [Sales]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [client_id, flag_ids]
 *             properties:
 *               client_id:
 *                 type: string
 *                 format: uuid
 *               plan_id:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *               flag_ids:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *               notes:
 *                 type: string
 *                 description: Observações (opcional)
 *     responses:
 *       201:
 *         description: Venda registrada com sucesso
 *       403:
 *         description: Vendedor tentou registrar venda para cliente de outro usuário
 *       404:
 *         description: Cliente, plano ou bandeira não encontrado
 *       422:
 *         description: Dados inválidos ou campo não permitido (strict mode)
 */
router.post(
  '/',
  authorize('admin', 'user'),
  validate(createSaleSchema),
  SaleController.create
);

/**
 * @swagger
 * /sales/{id}/status:
 *   patch:
 *     summary: Atualiza o status de uma venda (somente admin)
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
 *                 enum: [pending, analysis, approved]
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Status atualizado
 *       403:
 *         description: Somente admin pode alterar status
 *       404:
 *         description: Venda não encontrada
 *       409:
 *         description: Transição de status não permitida
 *       422:
 *         description: Dados inválidos ou campo não permitido (strict mode)
 */
router.patch(
  '/:id/status',
  authorize('admin'),
  validate(saleIdParamSchema, 'params'),
  validate(updateSaleStatusSchema),
  SaleController.updateStatus
);

/**
 * @swagger
 * /sales/{id}/cancel:
 *   patch:
 *     summary: Cancela uma venda
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
 *                 description: Motivo do cancelamento (opcional)
 *     responses:
 *       200:
 *         description: Venda cancelada
 *       403:
 *         description: Sem permissão para cancelar esta venda
 *       404:
 *         description: Venda não encontrada
 *       409:
 *         description: Venda approved não pode ser cancelada
 */
router.patch(
  '/:id/cancel',
  authorize('admin', 'user'),
  validate(saleIdParamSchema, 'params'),
  validate(cancelSaleSchema),
  SaleController.cancel
);

module.exports = router;
