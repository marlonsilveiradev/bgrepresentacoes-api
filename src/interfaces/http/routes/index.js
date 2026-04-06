/**
 * ROUTES INDEX: Orquestração de todas as rotas da API
 * 
 * ✅ Rate limiting em 3 níveis:
 *    1. Global (defaultLimiter) - protege todas as rotas
 *    2. Auth (authLimiter) - proteção intensiva para login
 *    3. Blacklist - bloqueio de IPs maliciosos
 * 
 * ✅ Organização por tipo de rota:
 *    - Públicas (sem autenticação)
 *    - Protegidas (com autenticação)
 *    - Admin (apenas admins)
 */

const { Router } = require('express');

// ─── Middlewares ───────────────────────────────────────────────────────────

const { 
  defaultLimiter, 
  authLimiter, 
  blacklistMiddleware,
  metricsMiddleware,
  getRateLimiterStatus,
} = require('../middlewares/rateLimiter');

const { authMiddleware } = require('../middlewares/authMiddleware');

// ─── Routes ────────────────────────────────────────────────────────────────

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

// ═══════════════════════════════════════════════════════════════════════════
// MIDDLEWARE GLOBAL: Aplicado a TODAS as requisições
// ═══════════════════════════════════════════════════════════════════════════

// ✅ PASSO 1: Registrar IP (para logs e segurança)
router.use((req, res, next) => {
  // Adicionar IP ao request para uso posterior
  const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() ||
    req.headers['x-real-ip'] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.ip;
  
  req.clientIP = ip;
  next();
});

// ✅ PASSO 2: Blacklist middleware (bloquear IPs maliciosos antes de tudo)
router.use(blacklistMiddleware);

// ✅ PASSO 3: Métricas (registrar todas as requisições)
router.use(metricsMiddleware);

// ✅ PASSO 4: Rate limit global (protege contra DDoS e abuso)
router.use(defaultLimiter);

// ═══════════════════════════════════════════════════════════════════════════
// HEALTH CHECK: Status da API
// ═══════════════════════════════════════════════════════════════════════════

/**
 * @swagger
 * /:
 *   get:
 *     summary: Status da API
 *     tags: [Health]
 *     security: []
 *     responses:
 *       200:
 *         description: API está online
 */
router.get('/', (req, res) => {
  res.json({ 
    api: 'BG Representações API', 
    version: 'v1', 
    status: 'online',
    timestamp: new Date().toISOString(),
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// HEALTH CHECK: Rate Limiter Status (Admin Only)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * @swagger
 * /health/rate-limiter:
 *   get:
 *     summary: Status do Rate Limiter (Admin)
 *     tags: [Health]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Status do rate limiter
 *       401:
 *         description: Não autenticado
 */
router.get('/health/rate-limiter', authMiddleware, (req, res) => {
  // Verificar se é admin
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      status: 'fail',
      message: 'Apenas admins podem acessar esta rota',
    });
  }

  const status = getRateLimiterStatus();
  return res.json({
    status: 'ok',
    rateLimiter: status,
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// ROTAS PÚBLICAS: Sem autenticação, mas com rate limit
// ═══════════════════════════════════════════════════════════════════════════

/**
 * @swagger
 * tags:
 *   - name: Auth
 *     description: Autenticação pública
 */
router.use('/auth', authLimiter, authRoutes);

// ═══════════════════════════════════════════════════════════════════════════
// ROTAS PROTEGIDAS: Requerem autenticação
// ═══════════════════════════════════════════════════════════════════════════

// ✅ Middleware de autenticação aplicado a todas as rotas a seguir
router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   - name: Users
 *     description: Gerenciamento de usuários
 */
router.use('/users', userRoutes);

/**
 * @swagger
 * tags:
 *   - name: Flags
 *     description: Gerenciamento de bandeiras
 */
router.use('/flags', flagRoutes);

/**
 * @swagger
 * tags:
 *   - name: Plans
 *     description: Gerenciamento de planos
 */
router.use('/plans', planRoutes);

/**
 * @swagger
 * tags:
 *   - name: Clients
 *     description: Gerenciamento de clientes
 */
router.use('/clients', clientRoutes);

/**
 * @swagger
 * tags:
 *   - name: Client Flags
 *     description: Bandeiras associadas a clientes
 */
router.use('/client-flags', clientFlagRoutes);

/**
 * @swagger
 * tags:
 *   - name: Sales
 *     description: Gerenciamento de vendas
 */
router.use('/sales', saleRoutes);

/**
 * @swagger
 * tags:
 *   - name: Onboarding
 *     description: Processo de cadastro de clientes
 */
router.use('/onboarding', onboardingRoutes);

/**
 * @swagger
 * tags:
 *   - name: Reports
 *     description: Relatórios gerenciais
 */
router.use('/reports', reportRoutes);

/**
 * @swagger
 * tags:
 *   - name: Documents
 *     description: Gerenciamento de documentos
 */
router.use('/documents', documentRoutes);

// ═══════════════════════════════════════════════════════════════════════════
// TRATAMENTO DE ROTAS NÃO ENCONTRADAS (404)
// ═══════════════════════════════════════════════════════════════════════════

router.use('*', (req, res) => {
  res.status(404).json({
    status: 'fail',
    message: `Rota não encontrada: ${req.originalUrl}`,
  });
});

module.exports = router;