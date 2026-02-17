/**
 * ROTAS DE AUTENTICAÇÃO
 */

const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const { authenticate } = require('../middlewares/auth');
const { requireAdmin } = require('../middlewares/authorization');
const {
    validateLogin,
    validateRegister,
    validateUpdate
} = require('../validators/authValidator');

/**
 * POST /api/auth/login
 * Público - Login
 */
router.post('/login', validateLogin, authController.login);

/**
 * GET /api/auth/me
 * Privado - Dados do usuário logado
 */
router.get('/me', authenticate, authController.getMe);

/**
 * PUT /api/auth/profile
 * Privado - Atualizar próprio perfil
 */
router.put('/profile', authenticate, validateUpdate, authController.updateProfile);

/**
 * POST /api/auth/register
 * Privado - Admin - Criar novo usuário
 */
router.post('/register', authenticate, requireAdmin, validateRegister, authController.register);

/**
 * GET /api/auth/users
 * Privado - Admin - Listar usuários
 */
router.get('/users', authenticate, requireAdmin, authController.listUsers);

/**
 * PUT /api/auth/users/:id
 * Privado - Admin - Atualizar usuário
 */
router.put('/users/:id', authenticate, requireAdmin, validateUpdate, authController.updateUser);

module.exports = router;