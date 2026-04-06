/**
 * ROUTES: User Routes
 * Refatorado para Clean Architecture
 * ✅ Respeita padrão original + mantém proteções
 */

const { Router } = require('express');
const UserController = require('../controllers/UserController');
const { authMiddleware, authorize } = require('../middlewares/authMiddleware');
const { validate } = require('../middlewares/validationMiddleware');
const {
  createUserSchema,
  updateUserSchema,
  updateProfileSchema,
  userIdParamSchema,
  listUsersQuerySchema,
  changeOwnPasswordSchema,
} = require('../validators/userValidators');

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Gerenciamento de usuários do sistema.
 */

// ─── Self-service: Perfil próprio ────────────────────────────────────────────
// IMPORTANTE: estas rotas devem vir ANTES do router.use(authMiddleware),
// Apenas autenticação obrigatória. Qualquer role pode acessar.

/**
 * @swagger
 * /users/profile:
 *   get:
 *     summary: Retorna os dados do próprio usuário autenticado.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dados do usuário retornados com sucesso.
 */
router.get(
  '/profile',
  authMiddleware,
  UserController.getProfile
);

/**
 * @swagger
 * /users/profile:
 *   patch:
 *     summary: Permite alterar apenas o próprio nome.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Novo Nome"
 *     responses:
 *       200:
 *         description: Perfil atualizado com sucesso.
 */
router.patch(
  '/profile',
  authMiddleware,
  validate(updateProfileSchema, 'body'),
  UserController.updateProfile
);

/**
 * @swagger
 * /users/profile/change-password:
 *   patch:
 *     summary: Alterar a própria senha via perfil
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Senha alterada com sucesso.
 *       401:
 *         description: Senha atual incorreta.
 */
router.patch(
  '/profile/change-password',
  authMiddleware,
  validate(changeOwnPasswordSchema, 'body'),
  UserController.changeOwnPassword
);

// ─── Autenticação obrigatória em TODAS as rotas deste ponto em diante ────────
router.use(authMiddleware);

// ─── Rotas administrativas ────────────────────────────────────────────────────
// A partir daqui, apenas admin tem acesso.
router.use(authorize('admin'));

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Lista todos os usuários com paginação e filtros.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [admin, user, partner]
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 */
router.get(
  '/',
  validate(listUsersQuerySchema, 'query'),
  UserController.list
);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Busca um usuário específico por UUID.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Usuário encontrado e retornado com sucesso.
 */
router.get(
  '/:id',
  validate(userIdParamSchema, 'params'),
  UserController.getById
);

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Cria novo usuário com senha temporária gerada automaticamente.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, role]
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               role:
 *                 type: string
 *                 enum: [admin, user, partner]
 *     responses:
 *       201:
 *         description: Usuário criado com sucesso.
 */
router.post(
  '/',
  validate(createUserSchema, 'body'),
  UserController.create
);

/**
 * @swagger
 * /users/{id}:
 *   patch:
 *     summary: Atualiza qualquer campo de um usuário.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               role:
 *                 type: string
 *                 enum: [admin, user, partner]
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Usuário atualizado com sucesso.
 */
router.patch(
  '/:id',
  validate(userIdParamSchema, 'params'),
  validate(updateUserSchema, 'body'),
  UserController.update
);

/**
 * @swagger
 * /users/{id}/deactivate:
 *   patch:
 *     summary: Desativa um usuário (is_active = false).
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Usuário desativado com sucesso.
 */
router.patch(
  '/:id/deactivate',
  validate(userIdParamSchema, 'params'),
  UserController.deactivate
);

/**
 * @swagger
 * /users/{id}/reactivate:
 *   patch:
 *     summary: Reativa um usuário desativado.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Usuário reativado com sucesso.
 */
router.patch(
  '/:id/reactivate',
  validate(userIdParamSchema, 'params'),
  UserController.reactivate
);

module.exports = router;