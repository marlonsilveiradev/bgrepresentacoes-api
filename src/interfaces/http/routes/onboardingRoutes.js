/**
 * ROUTES: Onboarding
 * 
 * Responsabilidade: Definir endpoints e middlewares
 * 
 * ✅ MIDDLEWARE STACK:
 * 1. authMiddleware - Autenticação JWT
 * 2. authorize - Autorização por role
 * 3. onboardingUpload - Validação de arquivos
 * 4. parseMultipartBody - Parse JSON + files
 * 5. validate(onboardingSchema) - Validação Yup
 * 6. validateFiles - Validação customizada de arquivos
 * 7. OnboardingController - Execução
 */

const express = require('express');
const router = express.Router();

// ✅ Injetar dependências
const OnboardingContainer = require('../../../infrastructure/container/OnboardingContainer');
const OnboardingController = require('../controllers/OnboardingController');

// Middleware
const { authMiddleware, authorize } = require('../middlewares/authMiddleware');
const parseMultipartBody = require('../middlewares/parseMultipartBody');
const { onboardingUpload } = require('../middlewares/uploadMiddleware');
const { onboardingSchema } = require('../validators/onboardingValidator');
const { validate } = require('../middlewares/validationMiddleware');
const { validateFiles } = require('../middlewares/upload/fileValidationMiddleware');

// Logger
const logger = require('../../../infrastructure/config/logger');

// ✅ Repositories (exemplo - ajustar conforme seu projeto)
const {
  clientRepository,
  planRepository,
  flagRepository,
  clientFlagRepository,
  clientBankAccountRepository,
  clientDocumentRepository
} = require('../../../infrastructure/repositories');

// ✅ Sequelize
const sequelize = require('../../../infrastructure/repositories/models').sequelize;

// ✅ Inicializar Container com dependências
let onboardingContainer;
let onboardingController;

try {
  onboardingContainer = new OnboardingContainer(
    clientRepository,
    planRepository,
    flagRepository,
    clientFlagRepository,
    clientBankAccountRepository,
    clientDocumentRepository,
    sequelize
  );

  onboardingController = new OnboardingController(onboardingContainer);

  logger.info(
    '[onboardingRoutes] Container e Controller inicializados com sucesso'
  );
} catch (error) {
  logger.error(
    { error: error.message },
    '[onboardingRoutes] ERRO ao inicializar Container/Controller'
  );
  throw error;
}

/**
 * @swagger
 * tags:
 *   name: Onboarding
 *   description: Processo de cadastro unificado de cliente
 */

/**
 * @swagger
 * /api/v1/onboarding:
 *   post:
 *     summary: Criar novo cliente via onboarding unificado
 *     tags: [Onboarding]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - corporate_name
 *               - responsible_name
 *               - cnpj
 *               - email
 *               - phone
 *               - benefit_type
 *               - address_street
 *               - address_number
 *               - address_city
 *               - address_state
 *               - address_zip
 *               - bank_name
 *               - agency
 *               - account
 *               - account_type
 *             properties:
 *               corporate_name:
 *                 type: string
 *                 example: "Empresa LTDA"
 *               responsible_name:
 *                 type: string
 *                 example: "João Silva"
 *               cnpj:
 *                 type: string
 *                 example: "12.345.678/0001-90"
 *               email:
 *                 type: string
 *                 format: email
 *               phone:
 *                 type: string
 *                 example: "(11) 98765-4321"
 *               benefit_type:
 *                 type: string
 *                 enum: [food, meal, both]
 *               address_state:
 *                 type: string
 *                 example: "SP"
 *               machine_name:
 *                 type: string
 *               machine_affiliation_code:
 *                 type: string
 *               plan_id:
 *                 type: string
 *                 format: uuid
 *               flag_ids:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *     responses:
 *       201:
 *         description: Cliente criado com sucesso
 *       400:
 *         description: Validação falhou
 *       401:
 *         description: Não autenticado
 */
router.post(
  '/',
  authMiddleware,
  authorize('admin', 'user'),
  onboardingUpload,
  parseMultipartBody,
  validate(onboardingSchema, 'body'),
  validateFiles({
    contrato: { required: false, max: 1 },
    documentos: { required: false, max: 3 },
  }),
  onboardingController.create
);

/**
 * @swagger
 * /api/v1/onboarding/status/{protocol}:
 *   get:
 *     summary: Consultar status do onboarding
 *     tags: [Onboarding]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: protocol
 *         required: true
 *         schema:
 *           type: string
 *         description: Protocolo do onboarding
 *     responses:
 *       200:
 *         description: Status do onboarding
 */
router.get(
  '/status/:protocolId',
  authMiddleware,
  onboardingController.getOnboardingStatus
);

module.exports = router;