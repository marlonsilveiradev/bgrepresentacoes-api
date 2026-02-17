/**
 * MIDDLEWARE DE AUTENTICAÇÃO
 */

const { verifyToken, extractTokenFromHeader } = require('../utils/jwt');
const { User } = require('../models');

/**
 * Verifica se o usuário está autenticado
 */
async function authenticate(req, res, next) {
    try {
        // Extrai token do header
        const token = extractTokenFromHeader(req);

        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Token não fornecido'
            });
        }

        // Verifica e decodifica o token
        const decoded = verifyToken(token);

        if (!decoded) {
            return res.status(401).json({
                success: false,
                error: 'Token inválido ou expirado'
            });
        }

        // Busca o usuário no banco
        const user = await User.findByPk(decoded.id);

        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Usuário não encontrado'
            });
        }

        if (!user.is_active) {
            return res.status(401).json({
                success: false,
                error: 'Usuário inativo'
            });
        }

        // Adiciona usuário à requisição
        req.user = user;

        next();
    } catch (error) {
        console.error('Erro na autenticação:', error);
        return res.status(500).json({
            success: false,
            error: 'Erro ao autenticar'
        });
    }
}

module.exports = { authenticate };