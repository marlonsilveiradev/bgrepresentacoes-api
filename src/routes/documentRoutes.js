const { Router } = require('express');
const DocumentController = require('../controllers/DocumentController');
const { authMiddleware, authorize } = require('../middlewares/authMiddleware');

const router = Router();

router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   name: Documents
 *   description: Download seguro de documentos via proxy
 */

/**
 * @swagger
 * /documents/{id}/download:
 *   get:
 *     summary: Download de documento via proxy (sem expor URL do Cloudinary)
 *     description: |
 *       Retorna o arquivo binário diretamente como resposta HTTP.
 *       A URL do Cloudinary nunca é exposta ao frontend.
 *
 *       **No frontend, use assim:**
 *       ```js
 *       const res  = await fetch('/api/v1/documents/:id/download', {
 *         headers: { Authorization: `Bearer ${token}` }
 *       });
 *       const blob = await res.blob();
 *       const url  = URL.createObjectURL(blob);
 *       window.open(url); // ou <img src={url} />
 *       ```
 *
 *       **Permissões:**
 *       - `admin` → qualquer documento
 *       - `user`  → apenas documentos de clientes que cadastrou
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *         description: UUID do ClientDocument
 *     responses:
 *       200:
 *         description: Binário do arquivo (image/jpeg, image/png ou application/pdf)
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       403:
 *         description: Sem permissão para acessar este documento
 *       404:
 *         description: Documento não encontrado
 */
router.get(
  '/:id/download',
  authorize('admin', 'user'),
  DocumentController.download
);

module.exports = router;