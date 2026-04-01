const { Router } = require('express');

const authRoutes       = require('../../http/routes/authRoutes');
const userRoutes       = require('../../http/routes/userRoutes');
const flagRoutes       = require('../../http/routes/flagRoutes');
const planRoutes       = require('../../http/routes/planRoutes');
const clientRoutes     = require('../../http/routes/clientRoutes');
const clientFlagRoutes = require('../../http/routes/clientFlagRoutes');
const saleRoutes       = require('../../http/routes/saleRoutes');
const onboardingRoutes = require('../../http/routes/onboardingRoutes');
const reportRoutes     = require('../../http/routes/reportRoutes');
const documentRoutes   = require('../../http/routes/documentRoutes');

const router = Router();


router.get('/', (req, res) => {
  res.json({ api: 'BG Representações API', version: 'v1', status: 'online' });
});

// ─── Rotas Públicas ──────────────────────────────────────────────────────────
router.use('/auth', authRoutes);

// ─── Rotas Protegidas ────────────────────────────────────────────────────────
router.use('/users',         userRoutes);
router.use('/flags',         flagRoutes);
router.use('/plans',         planRoutes);
router.use('/clients',       clientRoutes);
router.use('/client-flags',  clientFlagRoutes);
router.use('/sales',         saleRoutes);
router.use('/onboarding',    onboardingRoutes);
router.use('/reports',      reportRoutes);
router.use('/documents',    documentRoutes);

module.exports = router;