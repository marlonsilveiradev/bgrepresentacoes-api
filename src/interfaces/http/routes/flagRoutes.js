const { Router } = require('express');
const FlagController = require('../controllers/FlagController');
const { authMiddleware, authorize } = require('../../http/middlewares/authMiddleware');
const { validate } = require('../../http/middlewares/validationMiddleware');
const {
  createFlagSchema,
  updateFlagSchema,
  flagIdParamSchema,
  listFlagsQuerySchema,
} = require('../validators/flagValidators');

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Flags
 *   description: Gerenciamento de bandeiras de clientes
 */

/**
 * @swagger
 * /flags:
 *   get:
 *     summary: Lista todas as bandeiras. (Público - Sem Token)
 *     tags: [Flags]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *     responses:
 *       200:
 *         description: Lista de bandeiras retornada com sucesso
 */
router.get('/', validate(listFlagsQuerySchema, 'query'), FlagController.list);

/**
 * @swagger
 * /flags/{id}:
 *   get:
 *     summary: Retorna os detalhes de uma bandeira específica. (Público - Sem Token)
 *     tags: [Flags]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Detalhes da bandeira retornados com sucesso
 */
router.get('/:id', validate(flagIdParamSchema, 'params'), FlagController.getById);

// Autenticação obrigatória em todas as rotas
router.use(authMiddleware);



/**
 * @swagger
 * /flags:
 *   post:
 *     summary: Cria uma nova bandeira de cliente
 *     tags: [Flags]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               client_id:
 *                 type: string
 *                 format: uuid
 *               reason:
 *                 type: string
 *     responses:
 *       201:
 *         description: Bandeira criada com sucesso
 */
router.post('/', authorize('admin'), validate(createFlagSchema), FlagController.create);


/**
 * @swagger
 * /flags/{id}:
 *   patch:
 *     summary: Atualiza os detalhes de uma bandeira de cliente
 *     tags: [Flags]
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
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Bandeira atualizada com sucesso
 */
router.patch(
  '/:id',
  authorize('admin'),
  validate(flagIdParamSchema, 'params'),
  validate(updateFlagSchema),
  FlagController.update
);

/**
 * @swagger
 * /flags/{id}/deactivate:
 *   patch:
 *     summary: Desativa uma bandeira
 *     tags: [Flags]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Bandeira desativada com sucesso
 */
router.patch(
  '/:id/deactivate',
  authorize('admin'),
  validate(flagIdParamSchema, 'params'),
  FlagController.deactivate
);


/**
 * @swagger
 * /flags/{id}/reactivate:
 *   patch:
 *     summary: Reativa uma bandeira desativada
 *     tags: [Flags]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Bandeira reativada com sucesso
 */
router.patch(
  '/:id/reactivate',
  authorize('admin'),
  validate(flagIdParamSchema, 'params'),
  FlagController.reactivate
);

module.exports = router;
