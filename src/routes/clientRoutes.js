/**
 * ROTAS DE CLIENTES
 */

const express = require('express');
const router = express.Router();

const clientController = require('../controllers/clientController');
const { authenticate } = require('../middlewares/auth');
const { requireUserOrAdmin, requireAdmin } = require('../middlewares/authorization');
const {
    uploadFields,
    handleUploadError,
    validateRequiredFiles
} = require('../middlewares/upload');
const {
    validateCreateClient,
    validateUpdateClient,
    validateUpdateFlagStatus,
    validatePublicCheck,
    validateDocumentUpdate
} = require('../validators/clientValidator');

/**
 * GET /api/public/check-status
 * Público - Consulta por protocolo ou CNPJ
 */
router.get(
    '/public/check-status',
    validatePublicCheck,
    clientController.publicCheckStatus
);

/**
 * POST /api/clients
 * Privado - User/Admin - Criar cliente
 */
router.post(
    '/',
    authenticate,
    requireUserOrAdmin,
    uploadFields,
    handleUploadError,
    validateRequiredFiles,
    validateCreateClient,
    clientController.createClient
);

/**
 * GET /api/clients
 * Privado - Listar clientes (com filtros por role)
 */
router.get(
    '/',
    authenticate,
    clientController.listClients
);

/**
 * GET /api/clients/:id
 * Privado - Buscar cliente por ID
 */
router.get(
    '/:id',
    authenticate,
    clientController.getClientById
);

/**
 * PUT /api/clients/:id
 * Privado - User/Admin - Atualizar cliente
 */
router.put(
    '/:id',
    authenticate,
    requireUserOrAdmin,
    validateUpdateClient,
    clientController.updateClient
);

/**
 * PUT /api/clients/:id/documents
 * Privado - User/Admin - Atualizar documentos do cliente
 */
router.put(
    '/:id/documents',
    authenticate,
    requireUserOrAdmin,
    uploadFields,
    handleUploadError,
    validateDocumentUpdate,
    clientController.updateClientDocuments
);

/**
 * DELETE /api/clients/:id
 * Privado - Admin - Deletar cliente
 */
router.delete(
    '/:id',
    authenticate,
    requireAdmin,
    clientController.deleteClient
);

/**
 * PATCH /api/clients/:clientId/flags/:flagId/status
 * Privado - User/Admin - Atualizar status de bandeira individual
 */
router.patch(
    '/:clientId/flags/:flagId/status',
    authenticate,
    requireUserOrAdmin,
    validateUpdateFlagStatus,
    clientController.updateFlagStatus
);

module.exports = router;