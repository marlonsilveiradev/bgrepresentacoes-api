/**
 * CONTROLLER DE PLANOS
 */

const { Plan } = require('../models');

/**
 * LISTAR PLANOS
 * GET /api/plans
 */
async function listPlans(req, res) {
    try {
        const { is_active } = req.query;

        const where = {};
        if (is_active !== undefined) {
            where.is_active = is_active === 'true';
        }

        const plans = await Plan.findAll({
            where,
            order: [['created_at', 'ASC']]
        });

        return res.status(200).json({
            success: true,
            data: plans
        });

    } catch (error) {
        console.error('Erro ao listar planos:', error);
        return res.status(500).json({
            success: false,
            error: 'Erro ao listar planos'
        });
    }
}

/**
 * BUSCAR PLANO POR ID
 * GET /api/plans/:id
 */
async function getPlanById(req, res) {
    try {
        const { id } = req.params;

        const plan = await Plan.findByPk(id);

        if (!plan) {
            return res.status(404).json({
                success: false,
                error: 'Plano não encontrado'
            });
        }

        return res.status(200).json({
            success: true,
            data: plan
        });

    } catch (error) {
        console.error('Erro ao buscar plano:', error);
        return res.status(500).json({
            success: false,
            error: 'Erro ao buscar plano'
        });
    }
}

/**
 * CRIAR PLANO (apenas admin)
 * POST /api/plans
 */
async function createPlan(req, res) {
    try {
        const { name, code, description, flag_count, price } = req.body;

        const plan = await Plan.create({
            name,
            code,
            description,
            flag_count,
            price,
            is_active: true
        });

        return res.status(201).json({
            success: true,
            message: 'Plano criado com sucesso',
            data: plan
        });

    } catch (error) {
        console.error('Erro ao criar plano:', error);

        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({
                success: false,
                error: 'Já existe um plano com este nome ou código'
            });
        }

        return res.status(500).json({
            success: false,
            error: 'Erro ao criar plano'
        });
    }
}

/**
 * ATUALIZAR PLANO (apenas admin)
 * PUT /api/plans/:id
 */
async function updatePlan(req, res) {
    try {
        const { id } = req.params;
        const { name, description, flag_count, price, is_active } = req.body;

        const plan = await Plan.findByPk(id);

        if (!plan) {
            return res.status(404).json({
                success: false,
                error: 'Plano não encontrado'
            });
        }

        // Atualiza campos
        if (name) plan.name = name;
        if (description !== undefined) plan.description = description;
        if (flag_count !== undefined) plan.flag_count = flag_count;
        if (price !== undefined) plan.price = price;
        if (is_active !== undefined) plan.is_active = is_active;

        await plan.save();

        return res.status(200).json({
            success: true,
            message: 'Plano atualizado com sucesso',
            data: plan
        });

    } catch (error) {
        console.error('Erro ao atualizar plano:', error);
        return res.status(500).json({
            success: false,
            error: 'Erro ao atualizar plano'
        });
    }
}

/**
 * DELETAR PLANO (apenas admin)
 * DELETE /api/plans/:id
 */
async function deletePlan(req, res) {
    try {
        const { id } = req.params;

        const plan = await Plan.findByPk(id);

        if (!plan) {
            return res.status(404).json({
                success: false,
                error: 'Plano não encontrado'
            });
        }

        // Desativa ao invés de deletar (soft delete)
        plan.is_active = false;
        await plan.save();

        return res.status(200).json({
            success: true,
            message: 'Plano desativado com sucesso'
        });

    } catch (error) {
        console.error('Erro ao deletar plano:', error);
        return res.status(500).json({
            success: false,
            error: 'Erro ao deletar plano'
        });
    }
}

module.exports = {
    listPlans,
    getPlanById,
    createPlan,
    updatePlan,
    deletePlan
};