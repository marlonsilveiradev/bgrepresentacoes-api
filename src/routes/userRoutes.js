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
} = require('../validators/userValidators');

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Gerenciamento de usuários do sistema.
 */

// Autenticação obrigatória em TODAS as rotas deste arquivo
router.use(authMiddleware);

// ─── Self-service: Perfil próprio ────────────────────────────────────────────
// IMPORTANTE: estas rotas devem vir ANTES do authorize('admin') abaixo,
// pois qualquer role autenticada pode acessá-las.

/**
 * GET /api/v1/users/profile
 * Retorna os dados do próprio usuário autenticado.
 * Roles: admin, user, partner
 */

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
router.get('/profile', UserController.getProfile);

/**
 * PATCH /api/v1/users/profile
 * Permite alterar apenas o próprio nome.
 * E-mail, role e is_active são bloqueados — apenas admin pode alterar.
 * Roles: admin, user, partner
 */

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
  validate(updateProfileSchema),
  UserController.updateProfile
);

// ─── Rotas administrativas ────────────────────────────────────────────────────
// A partir daqui, apenas admin tem acesso.
router.use(authorize('admin'));

/**
 * GET /api/v1/users
 * Lista todos os usuários com paginação e filtros.
 */

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
 *     responses:
 *       200:
 *         description: Lista de usuários retornada com sucesso.
 */
router.get(
  '/',
  validate(listUsersQuerySchema, 'query'),
  UserController.list
);

/**
 * GET /api/v1/users/:id
 * Busca um usuário específico por UUID.
 */

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
 * POST /api/v1/users
 * Cria novo usuário com senha temporária gerada automaticamente.
 * A senha temporária é retornada UMA VEZ no response — repassar ao usuário.
 * No primeiro login, o sistema obriga a troca da senha (last_login_at = null).
 */

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
 *               name: {type: string}
 *               email: {type: string, format: email}
 *               role: {type: string, enum: [admin, user, partner]}
 *     responses:
 *       201:
 *         description: Usuário criado com sucesso.
 */
router.post(
  '/',
  validate(createUserSchema),
  UserController.create
);

/**
 * PATCH /api/v1/users/:id
 * Atualiza qualquer campo de um usuário.
 * Proteções: não pode mudar o próprio role nem se auto-desativar.
 */

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
 *               name: {type: string}
 *               email: {type: string, format: email}
 *               role: {type: string, enum: [admin, user, partner]}
 *               is_active: {type: boolean}
 *     responses:
 *       200:
 *         description: Usuário atualizado com sucesso.
 */
router.patch(
  '/:id',
  validate(userIdParamSchema, 'params'),
  validate(updateUserSchema),
  UserController.update
);

/**
 * PATCH /api/v1/users/:id/deactivate
 * Desativação lógica (is_active = false). Não deleta o registro.
 */

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
 * PATCH /api/v1/users/:id/reactivate
 * Reativa um usuário desativado.
 */

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
