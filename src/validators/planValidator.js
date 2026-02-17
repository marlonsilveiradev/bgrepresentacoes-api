/**
 * VALIDADORES DE PLANO (YUP)
 */

const yup = require('yup');

/**
 * Schema para CRIAR PLANO
 */
const createPlanSchema = yup.object().shape({
    name: yup
        .string()
        .required('Nome é obrigatório')
        .min(3, 'Nome muito curto')
        .max(100, 'Nome muito longo')
        .trim(),

    code: yup
        .string()
        .required('Código é obrigatório')
        .min(2, 'Código muito curto')
        .max(50, 'Código muito longo')
        .lowercase()
        .matches(/^[a-z0-9_]+$/, 'Código deve conter apenas letras minúsculas, números e underscore')
        .trim(),

    description: yup
        .string()
        .max(500, 'Descrição muito longa')
        .nullable(),

    flag_count: yup
        .number()
        .required('Quantidade de bandeiras é obrigatória')
        .integer('Deve ser um número inteiro')
        .min(0, 'Quantidade não pode ser negativa'),

    price: yup
        .number()
        .required('Preço é obrigatório')
        .min(0, 'Preço não pode ser negativo')
        .test('decimal-places', 'Preço deve ter no máximo 2 casas decimais',
            value => /^\d+(\.\d{1,2})?$/.test(String(value)))
});

/**
 * Schema para ATUALIZAR PLANO
 */
const updatePlanSchema = yup.object().shape({
    name: yup.string().min(3).max(100).trim(),
    description: yup.string().max(500).nullable(),
    flag_count: yup.number().integer().min(0),
    price: yup.number().min(0).test('decimal-places', 'Preço deve ter no máximo 2 casas decimais',
        value => value === undefined || /^\d+(\.\d{1,2})?$/.test(String(value))),
    is_active: yup.boolean()
});

const validate = (schema) => async (req, res, next) => {
    try {
        const validatedData = await schema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true
        });

        req.body = validatedData;
        next();
    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                error: 'Dados inválidos',
                details: error.errors
            });
        }

        return res.status(500).json({
            success: false,
            error: 'Erro ao validar dados'
        });
    }
};

module.exports = {
    validateCreatePlan: validate(createPlanSchema),
    validateUpdatePlan: validate(updatePlanSchema)
};