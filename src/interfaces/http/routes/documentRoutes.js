const { Router } = require('express');
const DocumentController = require('../controllers/DocumentController');
const { authMiddleware, authorize } = require('../middlewares/authMiddleware');
const { defaultLimiter } = require('../middlewares/rateLimiter');
const yup = require('yup');
const { validate } = require('../middlewares/validationMiddleware');

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Documents
 *   description: Download de documentos do cliente
 */

// Schema para validação do ID do documento
const documentIdParamSchema = yup.object({
  id: yup
    .string()
    .required('ID do documento é obrigatório.')
    .uuid('ID deve ser um UUID válido.'),
});

/**
 * @swagger
 * /documents/{id}/download:
 *   get:
 *     summary: Faz download de um documento do cliente
 *     description: |
 *       Download de documento com controle de acesso:
 *       - Admin: acessa qualquer documento
 *       - User: acessa documentos de clientes que criou
 *       - Partner: não possui permissão de download
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Arquivo do documento
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Acesso negado
 *       404:
 *         description: Documento não encontrado
 */
router.get(
  '/:id/download',
  authMiddleware,
  defaultLimiter,
  authorize('admin', 'user'),
  validate(documentIdParamSchema, 'params'),
  DocumentController.downloadDocument
);

module.exports = router;