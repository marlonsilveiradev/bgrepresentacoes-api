const express = require('express');
const router = express.Router();
const OnboardingController = require('../controllers/OnboardingController');
const { authMiddleware } = require('../middlewares/authMiddleware');
const { onboardingUpload } = require('../middlewares/uploadMiddleware');
const authorizeRoles = require('../middlewares/authorizeRoles');


/**
 * @swagger
 * tags:
 *   name: Onboarding
 *   description: Processo de cadastro unificado de cliente (Onboarding)
 */

/**
 * @swagger
 * /onboarding:
 *   post:
 *     summary: Inicia o processo de cadastro unificado de cliente (Onboarding)
 *     tags: [Onboarding]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               client_data:
 *                 type: string
 *               bank_account_data:
 *                 type: string
 *                 description: JSON string contendo os dados da conta bancária
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Onboarding iniciado com sucesso
 */
router.post('/', authMiddleware, authorizeRoles('admin', 'user'), onboardingUpload, OnboardingController.start);

module.exports = router;