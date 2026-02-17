/**
 * CONTROLLER DE AUTENTICAÇÃO
 */

const { User } = require('../models');
const { generateToken } = require('../utils/jwt');

/**
 * LOGIN
 * POST /api/auth/login
 */
async function login(req, res) {
    try {
        const { email, password } = req.body;

        // Autentica usuário
        const user = await User.authenticate(email, password);

        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Email ou senha incorretos'
            });
        }

        // Gera token
        const token = generateToken(user);

        // Retorna dados do usuário (sem senha)
        const userData = user.toSafeObject();

        return res.status(200).json({
            success: true,
            message: 'Login realizado com sucesso',
            data: {
                user: userData,
                token
            }
        });
    } catch (error) {
        console.error('Erro no login:', error);
        return res.status(500).json({
            success: false,
            error: 'Erro ao fazer login'
        });
    }
}

/**
 * REGISTRAR USUÁRIO (apenas admin pode)
 * POST /api/auth/register
 */
async function register(req, res) {
    try {
        const { name, email, password, role } = req.body;

        // Verifica se email já existe
        const existingUser = await User.findOne({ where: { email } });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                error: 'Email já cadastrado'
            });
        }

        // Cria usuário
        const user = await User.create({
            name,
            email,
            password,
            role: role || 'user',
            is_active: true,
            created_by: req.user.id // Quem criou (admin logado)
        });

        const userData = user.toSafeObject();

        return res.status(201).json({
            success: true,
            message: 'Usuário criado com sucesso',
            data: userData
        });
    } catch (error) {
        console.error('Erro ao registrar:', error);

        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({
                success: false,
                error: 'Dados inválidos',
                details: error.errors.map(e => e.message)
            });
        }

        return res.status(500).json({
            success: false,
            error: 'Erro ao criar usuário'
        });
    }
}

/**
 * OBTER DADOS DO USUÁRIO LOGADO
 * GET /api/auth/me
 */
async function getMe(req, res) {
    try {
        const user = await User.findByPk(req.user.id, {
            attributes: { exclude: ['password'] }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'Usuário não encontrado'
            });
        }

        return res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error('Erro ao buscar usuário:', error);
        return res.status(500).json({
            success: false,
            error: 'Erro ao buscar dados do usuário'
        });
    }
}

/**
 * ATUALIZAR PRÓPRIO PERFIL
 * PUT /api/auth/profile
 */
async function updateProfile(req, res) {
    try {
        const { name, email, password } = req.body;

        const user = await User.findByPk(req.user.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'Usuário não encontrado'
            });
        }

        // Verifica se email já existe (se estiver mudando)
        if (email && email !== user.email) {
            const existingUser = await User.findOne({ where: { email } });
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    error: 'Email já está em uso'
                });
            }
        }

        // Atualiza dados
        if (name) user.name = name;
        if (email) user.email = email;
        if (password) user.password = password; // Será hasheado pelo hook

        await user.save();

        const userData = user.toSafeObject();

        return res.status(200).json({
            success: true,
            message: 'Perfil atualizado com sucesso',
            data: userData
        });
    } catch (error) {
        console.error('Erro ao atualizar perfil:', error);
        return res.status(500).json({
            success: false,
            error: 'Erro ao atualizar perfil'
        });
    }
}

/**
 * LISTAR USUÁRIOS (apenas admin)
 * GET /api/auth/users
 */
async function listUsers(req, res) {
    try {
        const { role, is_active, page = 1, limit = 20 } = req.query;

        const where = {};
        if (role) where.role = role;
        if (is_active !== undefined) where.is_active = is_active === 'true';

        const offset = (page - 1) * limit;

        const { count, rows: users } = await User.findAndCountAll({
            where,
            attributes: { exclude: ['password'] },
            limit: parseInt(limit),
            offset: offset,
            order: [['created_at', 'DESC']]
        });

        return res.status(200).json({
            success: true,
            data: {
                users,
                pagination: {
                    total: count,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    pages: Math.ceil(count / limit)
                }
            }
        });
    } catch (error) {
        console.error('Erro ao listar usuários:', error);
        return res.status(500).json({
            success: false,
            error: 'Erro ao listar usuários'
        });
    }
}

/**
 * ATUALIZAR USUÁRIO (apenas admin)
 * PUT /api/auth/users/:id
 */
async function updateUser(req, res) {
    try {
        const { id } = req.params;
        const { name, email, role, is_active, password } = req.body;

        const user = await User.findByPk(id);

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'Usuário não encontrado'
            });
        }

        // Não pode desativar a si mesmo
        if (user.id === req.user.id && is_active === false) {
            return res.status(400).json({
                success: false,
                error: 'Você não pode desativar sua própria conta'
            });
        }

        // Atualiza campos
        if (name) user.name = name;
        if (email) user.email = email;
        if (role) user.role = role;
        if (is_active !== undefined) user.is_active = is_active;
        if (password) user.password = password;

        await user.save();

        const userData = user.toSafeObject();

        return res.status(200).json({
            success: true,
            message: 'Usuário atualizado com sucesso',
            data: userData
        });
    } catch (error) {
        console.error('Erro ao atualizar usuário:', error);
        return res.status(500).json({
            success: false,
            error: 'Erro ao atualizar usuário'
        });
    }
}

module.exports = {
    login,
    register,
    getMe,
    updateProfile,
    listUsers,
    updateUser
};