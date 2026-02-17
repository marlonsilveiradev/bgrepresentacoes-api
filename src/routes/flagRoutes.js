/**
 * ROTAS DE BANDEIRAS
 */

const express = require('express');
const router = express.Router();

const flagController = require('../controllers/flagController');
const { authenticate } = require('../middlewares/auth');
const { requireAdmin } = require('../middlewares/authorization');
const {
    validateCreateFlag,
    validateUpdateFlag
} = require('../validators/flagValidator');

/**
 * GET /api/flags
 * Público - Listar bandeiras ativas
 */
router.get('/', flagController.listFlags);

/**
 * GET /api/flags/:id
 * Público - Buscar bandeira por ID
 */
router.get('/:id', flagController.getFlagById);

/**
 * POST /api/flags
 * Privado - Admin - Criar bandeira
 */
router.post(
    '/',
    authenticate,
    requireAdmin,
    validateCreateFlag,
    flagController.createFlag
);

/**
 * PUT /api/flags/:id
 * Privado - Admin - Atualizar bandeira
 */
router.put(
    '/:id',
    authenticate,
    requireAdmin,
    validateUpdateFlag,
    flagController.updateFlag
);

/**
 * DELETE /api/flags/:id
 * Privado - Admin - Deletar bandeira
 */
router.delete(
    '/:id',
    authenticate,
    requireAdmin,
    flagController.deleteFlag
);

module.exports = router;