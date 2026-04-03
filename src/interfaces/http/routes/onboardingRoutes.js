const express = require('express');
const router = express.Router();
const OnboardingController = require('../../http/controllers/OnboardingController');
const { authMiddleware, authorize } = require('../../http/middlewares/authMiddleware');
const parseMultipartBody = require('../../http/middlewares/parseMultipartBody');
const { onboardingUpload } = require('../../http/middlewares/uploadMiddleware');
const { onboardingSchema } = require('../validators/onboardingValidator');
const { validate } = require('../middlewares/validationMiddleware');
const { validateFiles } = require('../middlewares/upload/fileValidationMiddleware')



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
router.post('/', authMiddleware, authorize('admin', 'user'),
onboardingUpload, 
parseMultipartBody, 
validate(onboardingSchema, 'body'),
validateFiles({
    contrato: { required: false, max: 1 },
    documentos: { required: false, max: 3 },
  }),
OnboardingController.start);

module.exports = router;