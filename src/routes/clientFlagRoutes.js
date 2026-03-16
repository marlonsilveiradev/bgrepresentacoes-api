const express = require('express');
const router = express.Router();
const ClientFlagController = require('../controllers/ClientFlagController');
const { authMiddleware, authorize } = require('../middlewares/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: ClientFlags
 *   description: Gerenciamento de status das bandeiras dos clientes
 */

router.use(authMiddleware);

/**
 * @swagger
 * /client-flags/{id}/status:
 *   patch:
 *     summary: Atualiza o status de aprovação de uma bandeira de cliente
 *     tags: [ClientFlags]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID do vínculo ClientFlag
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, analysis, approved]
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Status atualizado com sucesso
 *       403:
 *         description: Sem permissão
 *       404:
 *         description: Vínculo não encontrado
 */
router.patch('/:id/status', authorize('admin'), ClientFlagController.updateStatus);

module.exports = router;