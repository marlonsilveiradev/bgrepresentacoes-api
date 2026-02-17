/**
 * ROTAS DE RELATÓRIOS
 */

const express = require('express');
const router = express.Router();

const reportController = require('../controllers/reportController');
const { authenticate } = require('../middlewares/auth');
const { requireAdmin } = require('../middlewares/authorization');

/**
 * GET /api/reports/daily
 * Privado - Admin - Relatório diário
 */
router.get('/daily', authenticate, requireAdmin, reportController.dailyReport);

/**
 * GET /api/reports/monthly
 * Privado - Admin - Relatório mensal
 */
router.get('/monthly', authenticate, requireAdmin, reportController.monthlyReport);

/**
 * GET /api/reports/yearly
 * Privado - Admin - Relatório anual
 */
router.get('/yearly', authenticate, requireAdmin, reportController.yearlyReport);

/**
 * GET /api/reports/partner/:partnerId
 * Privado - Admin - Relatório por parceiro
 */
router.get('/partner/:partnerId', authenticate, requireAdmin, reportController.partnerReport);

module.exports = router;