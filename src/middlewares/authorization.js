/**
 * MIDDLEWARE DE AUTORIZAÇÃO
 */

/**
 * Verifica se o usuário é ADMIN
 */
function requireAdmin(req, res, next) {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: 'Não autenticado'
        });
    }

    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            error: 'Acesso negado. Apenas administradores'
        });
    }

    next();
}

/**
 * Verifica se o usuário é ADMIN ou USER (não partner)
 */
function requireUserOrAdmin(req, res, next) {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: 'Não autenticado'
        });
    }

    if (req.user.role === 'partner') {
        return res.status(403).json({
            success: false,
            error: 'Acesso negado. Partners não podem realizar esta ação'
        });
    }

    next();
}

/**
 * Verifica se o usuário pode acessar recurso de outro usuário
 */
function requireOwnershipOrAdmin(resourceUserIdField = 'created_by') {
    return async (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Não autenticado'
            });
        }

        // Admin pode acessar tudo
        if (req.user.role === 'admin') {
            return next();
        }

        // Verifica se é o dono do recurso
        const resourceUserId = req.resource ? req.resource[resourceUserIdField] : null;

        if (!resourceUserId || resourceUserId !== req.user.id) {
            return res.status(403).json({
                success: false,
                error: 'Acesso negado. Você só pode acessar seus próprios recursos'
            });
        }

        next();
    };
}

/**
 * Verifica se partner pode visualizar o cliente
 */
async function requirePartnerAccess(req, res, next) {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: 'Não autenticado'
        });
    }

    if (req.user.role === 'admin') {
        return next();
    }

    if (req.user.role === 'partner') {
        // Partner só pode ver se for o partner_id do cliente
        if (!req.resource || req.resource.partner_id !== req.user.id) {
            return res.status(403).json({
                success: false,
                error: 'Acesso negado. Você não é parceiro deste cliente'
            });
        }
    }

    if (req.user.role === 'user') {
        // User só pode ver se for o criador
        if (!req.resource || req.resource.created_by !== req.user.id) {
            return res.status(403).json({
                success: false,
                error: 'Acesso negado. Você não criou este cliente'
            });
        }
    }

    next();
}

module.exports = {
    requireAdmin,
    requireUserOrAdmin,
    requireOwnershipOrAdmin,
    requirePartnerAccess
};