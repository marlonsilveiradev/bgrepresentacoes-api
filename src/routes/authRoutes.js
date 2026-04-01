const { Router } = require('express');
const AuthController = require('../controllers/AuthController');
const { authMiddleware } = require('../middlewares/authMiddleware');
const { authLimiter } = require('../middlewares/rateLimiter');
const { validate } = require('../middlewares/validationMiddleware');
const { loginSchema, changePasswordSchema, refreshSchema } = require('../validators/authValidators');

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Autenticação e gerenciamento de tokens JWT
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Realiza login e retorna tokens JWT
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 example: admin@seuemail.com
 *               password:
 *                 type: string
 *                 example: sua_senha_secreta
 *     responses:
 *       200:
 *         description: |
 *           Login realizado. Se `mustChangePassword` for `true`,
 *           o usuário deve chamar PATCH /auth/change-password antes de prosseguir.
 *       401:
 *         description: Credenciais inválidas
 *       422:
 *         description: Dados inválidos (validação Yup)
 *       429:
 *         description: Muitas tentativas de login
 */
router.post(
  '/login',
  authLimiter,
  validate(loginSchema),
  AuthController.login
);

/**
 * @swagger
 * /auth/change-password:
 *   patch:
 *     summary: Troca a senha do usuário autenticado
 *     description: |
 *       Obrigatório no primeiro login (quando `mustChangePassword` é true).
 *       Também disponível para trocas voluntárias.
 *       Após a troca no primeiro login, o `last_login_at` é definido.
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword, confirmPassword]
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 description: Mín. 8 chars, maiúscula, minúscula, número e especial
 *               confirmPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Senha alterada com sucesso
 *       400:
 *         description: Nova senha igual à atual
 *       401:
 *         description: Senha atual incorreta ou token inválido
 *       422:
 *         description: Dados inválidos (política de senha não atendida)
 */
router.patch(
  '/change-password',
  authMiddleware,
  validate(changePasswordSchema),
  AuthController.changePassword
);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Renova o access token usando o refresh token
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Novo access token gerado
 *       401:
 *         description: Refresh token inválido ou expirado
 */
router.post('/refresh', validate(refreshSchema), AuthController.refresh);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Realiza logout (cliente descarta o token)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout realizado com sucesso
 */
router.post('/logout', authMiddleware, AuthController.logout);

module.exports = router;
