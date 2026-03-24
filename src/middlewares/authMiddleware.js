const { verifyToken } = require('../utils/auth');
const { User } = require('../models');
const logger = require('../config/logger');

/**
 * Middleware de autenticação JWT.
 * Protege rotas privadas verificando o token no header Authorization.
 */
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // 1. Verifica se o header Authorization existe e começa com 'Bearer '
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token de autenticação não fornecido.' });
    }

    const token = authHeader.split(' ')[1];

    // 2. Verifica a assinatura e expiração do token usando a util que criamos
    const decoded = verifyToken(token);

    // 3. Busca o usuário no banco para garantir que ele ainda existe e está ativo
    const user = await User.findByPk(decoded.id, {
      attributes: ['id', 'name', 'email', 'role', 'is_active'],
    });

    if (!user) {
      return res.status(401).json({ error: 'Usuário não encontrado.' });
    }

    if (!user.is_active) {
      return res.status(403).json({ error: 'Conta desativada. Acesso negado.' });
    }

    // 4. Injeta o objeto user dentro da requisição (req.user)
    // Isso permite que o Controller saiba QUEM está logado (ex: req.user.id)
    req.user = user;

    logger.debug({ userId: user.id, route: req.originalUrl }, 'Requisição autenticada com sucesso.');

    return next();
  } catch (err) {
    // 1. Tratamento específico para erros de Token (Expirado ou Inválido)
    if (err.message.includes('Token expirado') || err.message.includes('Token inválido')) {
      return res.status(401).json({ 
        error: 'Não autorizado', 
        message: err.message 
      });
    }

    // 2. Se você usa o AppError com statusCode (como estava no seu código original)
    if (err.statusCode) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    
    // 3. Log de erro inesperado para o seu controle
    logger.error(err, 'Erro interno no middleware de autenticação');

    // 4. Para outros erros inesperados, interrompe a requisição com 500 amigável
    return res.status(500).json({ error: 'Erro interno ao processar autenticação.' });
  }
};

/**
 * Middleware de autorização por papel (role).
 * Uso: router.get('/admin-only', authMiddleware, authorize('admin'), controller)
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Não autenticado.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: `Acesso negado. Entre em contato com o administrador para obter permissão.`, 
      });
    }

    return next();
  };
};

module.exports = { authMiddleware, authorize };