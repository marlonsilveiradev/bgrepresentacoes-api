/**
 * ROTAS DE PLANOS
 */

const express = require('express');
const router = express.Router();

const planController = require('../controllers/planController');
const { authenticate } = require('../middlewares/auth');
const { requireAdmin } = require('../middlewares/authorization');
const {
    validateCreatePlan,
    validateUpdatePlan
} = require('../validators/planValidator');

/**
 * GET /api/plans
 * Público - Listar planos ativos
 */
router.get('/', planController.listPlans);

/**
 * GET /api/plans/:id
 * Público - Buscar plano por ID
 */
router.get('/:id', planController.getPlanById);

/**
 * POST /api/plans
 * Privado - Admin - Criar plano
 */
router.post(
    '/',
    authenticate,
    requireAdmin,
    validateCreatePlan,
    planController.createPlan
);

/**
 * PUT /api/plans/:id
 * Privado - Admin - Atualizar plano
 */
router.put(
    '/:id',
    authenticate,
    requireAdmin,
    validateUpdatePlan,
    planController.updatePlan
);

/**
 * DELETE /api/plans/:id
 * Privado - Admin - Deletar plano
 */
router.delete(
    '/:id',
    authenticate,
    requireAdmin,
    planController.deletePlan
);

module.exports = router;