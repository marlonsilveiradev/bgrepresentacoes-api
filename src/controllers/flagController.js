/**
 * CONTROLLER DE BANDEIRAS
 */

const { Flag } = require('../models');

/**
 * LISTAR BANDEIRAS
 * GET /api/flags
 */
async function listFlags(req, res) {
    try {
        const { is_active } = req.query;

        const where = {};
        if (is_active !== undefined) {
            where.is_active = is_active === 'true';
        }

        const flags = await Flag.findAll({
            where,
            order: [['name', 'ASC']]
        });

        return res.status(200).json({
            success: true,
            data: flags
        });

    } catch (error) {
        console.error('Erro ao listar bandeiras:', error);
        return res.status(500).json({
            success: false,
            error: 'Erro ao listar bandeiras'
        });
    }
}

/**
 * BUSCAR BANDEIRA POR ID
 * GET /api/flags/:id
 */
async function getFlagById(req, res) {
    try {
        const { id } = req.params;

        const flag = await Flag.findByPk(id);

        if (!flag) {
            return res.status(404).json({
                success: false,
                error: 'Bandeira não encontrada'
            });
        }

        return res.status(200).json({
            success: true,
            data: flag
        });

    } catch (error) {
        console.error('Erro ao buscar bandeira:', error);
        return res.status(500).json({
            success: false,
            error: 'Erro ao buscar bandeira'
        });
    }
}

/**
 * CRIAR BANDEIRA (apenas admin)
 * POST /api/flags
 */
async function createFlag(req, res) {
    try {
        const { name, code, description, price } = req.body;

        const flag = await Flag.create({
            name,
            code,
            description,
            price,
            is_active: true
        });

        return res.status(201).json({
            success: true,
            message: 'Bandeira criada com sucesso',
            data: flag
        });

    } catch (error) {
        console.error('Erro ao criar bandeira:', error);

        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({
                success: false,
                error: 'Já existe uma bandeira com este nome ou código'
            });
        }

        return res.status(500).json({
            success: false,
            error: 'Erro ao criar bandeira'
        });
    }
}

/**
 * ATUALIZAR BANDEIRA (apenas admin)
 * PUT /api/flags/:id
 */
async function updateFlag(req, res) {
    try {
        const { id } = req.params;
        const { name, description, price, is_active } = req.body;

        const flag = await Flag.findByPk(id);

        if (!flag) {
            return res.status(404).json({
                success: false,
                error: 'Bandeira não encontrada'
            });
        }

        // Atualiza campos
        if (name) flag.name = name;
        if (description !== undefined) flag.description = description;
        if (price !== undefined) flag.price = price;
        if (is_active !== undefined) flag.is_active = is_active;

        await flag.save();

        return res.status(200).json({
            success: true,
            message: 'Bandeira atualizada com sucesso',
            data: flag
        });

    } catch (error) {
        console.error('Erro ao atualizar bandeira:', error);
        return res.status(500).json({
            success: false,
            error: 'Erro ao atualizar bandeira'
        });
    }
}

/**
 * DELETAR BANDEIRA (apenas admin)
 * DELETE /api/flags/:id
 */
async function deleteFlag(req, res) {
    try {
        const { id } = req.params;

        const flag = await Flag.findByPk(id);

        if (!flag) {
            return res.status(404).json({
                success: false,
                error: 'Bandeira não encontrada'
            });
        }

        // Desativa ao invés de deletar
        flag.is_active = false;
        await flag.save();

        return res.status(200).json({
            success: true,
            message: 'Bandeira desativada com sucesso'
        });

    } catch (error) {
        console.error('Erro ao deletar bandeira:', error);
        return res.status(500).json({
            success: false,
            error: 'Erro ao deletar bandeira'
        });
    }
}

module.exports = {
    listFlags,
    getFlagById,
    createFlag,
    updateFlag,
    deleteFlag
};