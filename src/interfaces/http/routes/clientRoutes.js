const { Router } = require('express');
const yup = require('yup');
const ClientController = require('../../http/controllers/ClientController');
const { authMiddleware, authorize } = require('../../http/middlewares/authMiddleware');
const { defaultLimiter } = require('../../http/middlewares/rateLimiter');
const parseMultipartBody = require('../../http/middlewares/parseMultipartBody');
const { validate } = require('../../http/middlewares/validationMiddleware');
const { clientUpdateUpload } = require('../../http/middlewares/uploadMiddleware');
const {
  updateClientSchema,
  clientIdParamSchema,
  listClientsQuerySchema,
} = require('../validators/clientValidators');

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Clients
 *   description: Gerenciamento de clientes e consulta de protocolo
 */

// Rota Pública — sem token
const protocolParamSchema = yup.object({
  protocol: yup.string().required(),
});
router.get('/public/track/:protocol', defaultLimiter, validate(protocolParamSchema, 'params'), ClientController.trackByProtocol);

// Autenticação obrigatória a partir daqui
router.use(authMiddleware);

/**
 * @swagger
 * /clients:
 *   get:
 *     summary: Lista todos os clientes com paginação e filtros
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: overall_status
 *         schema: { type: string, enum: [pending, analysis, approved] }
 *       - in: query
 *         name: benefit_type
 *         schema: { type: string, enum: [food, meal, both] }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Lista de clientes retornada com sucesso
 */
router.get(
  '/',
  authorize('admin', 'user', 'partner'),
  validate(listClientsQuerySchema, 'query'),
  ClientController.list
);

/**
 * @swagger
 * /clients/{id}:
 *   get:
 *     summary: Retorna os detalhes de um cliente específico
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Detalhes do cliente retornados com sucesso
 */
router.get(
  '/:id',
  authorize('admin', 'user', 'partner'),
  validate(clientIdParamSchema, 'params'),
  ClientController.getById
);

/**
 * @swagger
 * /clients/{id}:
 *   patch:
 *     summary: Atualiza dados de um cliente existente
 *     description: |
 *       Aceita `application/json` (apenas dados textuais) ou `multipart/form-data`
 *       (dados textuais + documentos).
 *
 *       Quando enviar arquivos, use `multipart/form-data`:
 *       - Campo `data`: JSON string com os campos a atualizar
 *       - Campo `contrato`: arquivo do contrato (substitui o existente)
 *       - Campo `documentos`: até 3 arquivos complementares
 *
 *       Quando enviar apenas dados, use `application/json` normalmente.
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Cliente atualizado com sucesso
 *       403:
 *         description: Sem permissão para atualizar este cliente
 *       404:
 *         description: Cliente não encontrado
 */
router.patch(
  '/:id',
  authorize('admin', 'user'),
  validate(clientIdParamSchema, 'params'),
  clientUpdateUpload,
  parseMultipartBody,
  validate(updateClientSchema),
  ClientController.updateClient
);

module.exports = router;