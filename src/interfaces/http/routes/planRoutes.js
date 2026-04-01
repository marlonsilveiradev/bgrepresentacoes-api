const { Router } = require('express');
const PlanController = require('../../http/controllers/PlanController');
const { authMiddleware, authorize } = require('../../http/middlewares/authMiddleware');
const { validate } = require('../../http/middlewares/validationMiddleware');
const {
  createPlanSchema,
  updatePlanSchema,
  planIdParamSchema,
  listPlansQuerySchema,
} = require('../validators/planValidators');

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Plans
 *   description: Gerenciamento de planos de benefícios
 */


/**
 * @swagger
 * /plans:
 *   get:
 *     summary: Lista todos os planos de benefícios com paginação e filtros. (Público - Sem Token)
 *     tags: [Plans]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *     responses:
 *       200:
 *         description: Lista de planos retornada com sucesso
 */
router.get('/', validate(listPlansQuerySchema, 'query'), PlanController.list);

/**
 * @swagger
 * /plans/{id}:
 *   get:
 *     summary: Obtém um plano de benefício específico pelo ID.(Público - Sem Token)
 *     tags: [Plans]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema: { type: string, format: uuid }
 *         required: true
 *     responses:
 *       200:
 *         description: Plano de benefício retornado com sucesso
 */
router.get('/:id', validate(planIdParamSchema, 'params'), PlanController.getById);

// Rotas de Escrita - Somente Admin
router.use(authMiddleware, authorize('admin'));


/**
 * @swagger
 * /plans:
 *   post:
 *     summary: Cria um novo plano de benefício
 *     tags: [Plans]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Plano de benefício criado com sucesso
 */
router.post('/', validate(createPlanSchema), PlanController.create);

/**
 * @swagger
 * /plans/{id}:
 *   patch:
 *     summary: Atualiza um plano de benefício existente
 *     tags: [Plans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema: { type: string, format: uuid }
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Plano de benefício atualizado com sucesso
 *       404:
 *         description: Plano de benefício não encontrado
 */
router.patch('/:id', validate(planIdParamSchema, 'params'), validate(updatePlanSchema), PlanController.update);

/**
 * @swagger
 * /plans/{id}/deactivate:
 *   patch:
 *     summary: Desativa um plano de benefício
 *     tags: [Plans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema: { type: string, format: uuid }
 *         required: true
 *     responses:
 *       200:
 *         description: Plano de benefício desativado com sucesso
 *       404:
 *         description: Plano de benefício não encontrado
 */
router.patch('/:id/deactivate', validate(planIdParamSchema, 'params'), PlanController.deactivate);

/**
 * @swagger
 * /plans/{id}/reactivate:
 *   patch:
 *     summary: Reativa um plano de benefício desativado
 *     tags: [Plans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema: { type: string, format: uuid }
 *         required: true
 *     responses:
 *       200:
 *         description: Plano de benefício reativado com sucesso
 *       404:
 *         description: Plano de benefício não encontrado
 */
router.patch('/:id/reactivate', validate(planIdParamSchema, 'params'), PlanController.reactivate);

module.exports = router;