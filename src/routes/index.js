const { Router } = require('express');

const authRoutes       = require('./authRoutes');
const userRoutes       = require('./userRoutes');
const flagRoutes       = require('./flagRoutes');
const planRoutes       = require('./planRoutes');
const clientRoutes     = require('./clientRoutes');
const clientFlagRoutes = require('./clientFlagRoutes'); // Nova rota
const saleRoutes       = require('./saleRoutes');
const onboardingRoutes = require('./onboardingRoutes');
const reportRoutes     = require('./reportRoutes');
const documentRoutes   = require('./documentRoutes');

const router = Router();


router.get('/', (req, res) => {
  res.json({ api: 'Vale Alimentação API', version: 'v1', status: 'online' });
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