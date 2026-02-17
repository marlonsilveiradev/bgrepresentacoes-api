/**
 * VALIDADORES DE AUTENTICAÇÃO (YUP)
 * 
 * Valida dados de login, registro e atualização de usuários
 */

const yup = require('yup');

/**
 * Schema de validação para LOGIN
 */
const loginSchema = yup.object().shape({
    email: yup
        .string()
        .required('Email é obrigatório')
        .email('Email inválido')
        .lowercase()
        .trim(),

    password: yup
        .string()
        .required('Senha é obrigatória')
        .min(6, 'Senha deve ter no mínimo 6 caracteres')
});

/**
 * Schema de validação para REGISTRO DE USUÁRIO
 */
const registerSchema = yup.object().shape({
    name: yup
        .string()
        .required('Nome é obrigatório')
        .min(3, 'Nome deve ter no mínimo 3 caracteres')
        .max(255, 'Nome muito longo')
        .trim(),

    email: yup
        .string()
        .required('Email é obrigatório')
        .email('Email inválido')
        .lowercase()
        .trim(),

    password: yup
        .string()
        .required('Senha é obrigatória')
        .min(6, 'Senha deve ter no mínimo 6 caracteres')
        .max(255, 'Senha muito longa'),

    role: yup
        .string()
        .oneOf(['user', 'admin', 'partner'], 'Role inválido')
        .default('user'),

    is_active: yup
        .boolean()
        .default(true)
});

/**
 * Schema de validação para ATUALIZAÇÃO DE USUÁRIO
 */
const updateUserSchema = yup.object().shape({
    name: yup
        .string()
        .min(3, 'Nome deve ter no mínimo 3 caracteres')
        .max(255, 'Nome muito longo')
        .trim(),

    email: yup
        .string()
        .email('Email inválido')
        .lowercase()
        .trim(),

    password: yup
        .string()
        .min(6, 'Senha deve ter no mínimo 6 caracteres')
        .max(255, 'Senha muito longa'),

    role: yup
        .string()
        .oneOf(['user', 'admin', 'partner'], 'Role inválido'),

    is_active: yup
        .boolean()
});

/**
 * Middleware de validação
 */
const validate = (schema) => async (req, res, next) => {
    try {
        // Valida e transforma os dados
        const validatedData = await schema.validate(req.body, {
            abortEarly: false, // Retorna todos os erros, não apenas o primeiro
            stripUnknown: true // Remove campos não definidos no schema
        });

        // Substitui req.body pelos dados validados
        req.body = validatedData;

        next();
    } catch (error) {
        // Se for erro de validação do Yup
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                error: 'Dados inválidos',
                details: error.errors // Array com todas as mensagens de erro
            });
        }

        // Outro tipo de erro
        return res.status(500).json({
            success: false,
            error: 'Erro ao validar dados'
        });
    }
};

module.exports = {
    validateLogin: validate(loginSchema),
    validateRegister: validate(registerSchema),
    validateUpdate: validate(updateUserSchema)
};