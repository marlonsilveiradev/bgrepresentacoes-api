/**
 * VALIDADORES DE CLIENTE (YUP)
 */

const yup = require('yup');

/**
 * Validação customizada de CNPJ
 */
function validateCNPJ(cnpj) {
    if (!cnpj) return false;

    cnpj = cnpj.replace(/[^\d]/g, '');

    if (cnpj.length !== 14) return false;

    // CNPJs inválidos conhecidos
    const invalidCNPJs = [
        '00000000000000', '11111111111111', '22222222222222',
        '33333333333333', '44444444444444', '55555555555555',
        '66666666666666', '77777777777777', '88888888888888',
        '99999999999999'
    ];

    if (invalidCNPJs.includes(cnpj)) return false;

    // Validação dos dígitos verificadores
    let length = cnpj.length - 2;
    let numbers = cnpj.substring(0, length);
    const digits = cnpj.substring(length);
    let sum = 0;
    let pos = length - 7;

    for (let i = length; i >= 1; i--) {
        sum += numbers.charAt(length - i) * pos--;
        if (pos < 2) pos = 9;
    }

    let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result != digits.charAt(0)) return false;

    length = length + 1;
    numbers = cnpj.substring(0, length);
    sum = 0;
    pos = length - 7;

    for (let i = length; i >= 1; i--) {
        sum += numbers.charAt(length - i) * pos--;
        if (pos < 2) pos = 9;
    }

    result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result != digits.charAt(1)) return false;

    return true;
}


/**
 * Teste customizado para detectar HTML/XSS
 */
const noHtmlTest = {
    name: 'no-html',
    message: 'Campo não pode conter tags HTML ou scripts',
    test: (value) => {
        if (!value) return true;
        // Detecta tags HTML
        return !/<[^>]*>/g.test(value);
    }
};

/**
 * Schema de validação para CRIAR CLIENTE
 */
const createClientSchema = yup.object().shape({
    // Dados básicos
    name: yup
        .string()
        .required('Nome é obrigatório')
        .test(noHtmlTest)
        .min(3, 'Nome muito curto')
        .max(255, 'Nome muito longo')
        .trim(),

    razao_social: yup
        .string()
        .required('Razão social é obrigatória')
        .test(noHtmlTest)
        .min(3, 'Razão social muito curta')
        .max(255, 'Razão social muito longa')
        .trim(),

    ramo_atividade: yup
        .string()
        .test(noHtmlTest)
        .max(255, 'Ramo de atividade muito longo')
        .trim()
        .nullable(),

    tipo_cartao: yup
        .string()
        .required('Tipo de cartão é obrigatório')
        .oneOf(['alimentacao', 'refeicao', 'ambos'], 'Tipo de cartão inválido'),

    // Endereço
    rua: yup
        .string()
        .required('Rua é obrigatória')
        .max(255, 'Rua muito longa')
        .trim(),

    numero: yup
        .string()
        .required('Número é obrigatório')
        .max(20, 'Número muito longo')
        .trim(),

    complemento: yup
        .string()
        .max(100, 'Complemento muito longo')
        .trim()
        .nullable(),

    bairro: yup
        .string()
        .required('Bairro é obrigatório')
        .max(100, 'Bairro muito longo')
        .trim(),

    cidade: yup
        .string()
        .required('Cidade é obrigatória')
        .max(100, 'Cidade muito longa')
        .trim(),

    estado: yup
        .string()
        .required('Estado é obrigatório')
        .length(2, 'Estado deve ter 2 caracteres (UF)')
        .uppercase()
        .matches(/^[A-Z]{2}$/, 'Estado inválido'),

    cep: yup
        .string()
        .required('CEP é obrigatório')
        .matches(/^\d{8}$/, 'CEP deve ter 8 dígitos numéricos')
        .transform(value => value.replace(/[^\d]/g, '')),

    // Documentos
    cnpj: yup
        .string()
        .required('CNPJ é obrigatório')
        .transform(value => value.replace(/[^\d]/g, ''))
        .test('is-valid-cnpj', 'CNPJ inválido', validateCNPJ),

    inscricao_estadual: yup
        .string()
        .max(20, 'Inscrição estadual muito longa')
        .nullable(),

    // Contato
    email: yup
        .string()
        .required('Email é obrigatório')
        .email('Email inválido')
        .lowercase()
        .trim(),

    telefone: yup
        .string()
        .required('Telefone é obrigatório')
        .matches(/^\d{10,11}$/, 'Telefone deve ter 10 ou 11 dígitos')
        .transform(value => value.replace(/[^\d]/g, '')),

    // Dados bancários (opcionais)
    banco: yup
        .string()
        .max(100, 'Nome do banco muito longo')
        .nullable(),

    agencia: yup
        .string()
        .max(10, 'Agência muito longa')
        .nullable(),

    conta: yup
        .string()
        .max(20, 'Conta muito longa')
        .nullable(),

    digito: yup
        .string()
        .max(2, 'Dígito muito longo')
        .nullable(),

    // Plano
    plan_id: yup
        .string()
        .required('Plano é obrigatório')
        .uuid('ID de plano inválido'),

    selected_flags: yup
        .mixed()
        .required('Bandeiras são obrigatórias')
        .test('is-array', 'Bandeiras devem ser um array', function (value) {
            // Se vier como string JSON, converte
            if (typeof value === 'string') {
                try {
                    const parsed = JSON.parse(value);
                    this.parent.selected_flags = parsed; // Substitui no objeto
                    return Array.isArray(parsed);
                } catch {
                    return false;
                }
            }
            return Array.isArray(value);
        })
        .test('min-flags', 'Selecione pelo menos uma bandeira', function (value) {
            const arr = typeof value === 'string' ? JSON.parse(value) : value;
            return arr && arr.length >= 1;
        })
        .test('valid-uuids', 'IDs de bandeira inválidos', function (value) {
            const arr = typeof value === 'string' ? JSON.parse(value) : value;
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            return arr && arr.every(id => uuidRegex.test(id));
        }),

    // Partner (opcional)
    partner_id: yup
        .string()
        .uuid('ID de parceiro inválido')
        .nullable(),

    // Observações
    notes: yup
        .string()
        .nullable()
});

/**
 * Schema de validação para ATUALIZAR CLIENTE
 */
const updateClientSchema = yup.object().shape({
    name: yup.string().min(3).max(255).trim(),
    razao_social: yup.string().min(3).max(255).trim(),
    ramo_atividade: yup.string().max(255).trim().nullable(),
    tipo_cartao: yup.string().oneOf(['alimentacao', 'refeicao', 'ambos']),

    rua: yup.string().max(255).trim(),
    numero: yup.string().max(20).trim(),
    complemento: yup.string().max(100).trim().nullable(),
    bairro: yup.string().max(100).trim(),
    cidade: yup.string().max(100).trim(),
    estado: yup.string().length(2).uppercase(),
    cep: yup.string().matches(/^\d{8}$/).transform(v => v.replace(/[^\d]/g, '')),

    email: yup.string().email().lowercase().trim(),
    telefone: yup.string().matches(/^\d{10,11}$/).transform(v => v.replace(/[^\d]/g, '')),

    banco: yup.string().max(100).nullable(),
    agencia: yup.string().max(10).nullable(),
    conta: yup.string().max(20).nullable(),
    digito: yup.string().max(2).nullable(),

    partner_id: yup.string().uuid().nullable(),
    notes: yup.string().nullable()
});

/**
 * Schema para ATUALIZAR STATUS DE BANDEIRA
 */
const updateFlagStatusSchema = yup.object().shape({
    status: yup
        .string()
        .required('Status é obrigatório')
        .oneOf(['pending', 'in_analysis', 'approved'], 'Status inválido')
});

/**
 * Schema para CONSULTA PÚBLICA
 */
const publicCheckSchema = yup.object().shape({
    protocol: yup
        .string()
        .matches(/^\d{8}-\d{6}$/, 'Formato de protocolo inválido')
        .when('cnpj', {
            is: (cnpj) => !cnpj,
            then: (schema) => schema.required('Informe protocolo ou CNPJ')
        }),

    cnpj: yup
        .string()
        .transform(value => value ? value.replace(/[^\d]/g, '') : value)
        .test('is-valid-cnpj', 'CNPJ inválido', function (value) {
            if (!value && !this.parent.protocol) {
                return false;
            }
            if (value) {
                return validateCNPJ(value);
            }
            return true;
        })
});

/**
 * Middleware de validação
 */
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

/**
 * Validação de query params
 */
const validateQuery = (schema) => async (req, res, next) => {
    try {
        const validatedData = await schema.validate(req.query, {
            abortEarly: false,
            stripUnknown: true
        });

        req.query = validatedData;
        next();
    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                error: 'Parâmetros inválidos',
                details: error.errors
            });
        }

        return res.status(500).json({
            success: false,
            error: 'Erro ao validar parâmetros'
        });
    }
};

/**
 * Middleware de validação para documentos
 */
const validateDocumentUpdate = (req, res, next) => {
    // Verifica se pelo menos um arquivo foi enviado
    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).json({
            success: false,
            error: 'Envie pelo menos um documento para atualizar'
        });
    }

    // Valida campos permitidos
    const allowedFields = ['document', 'invoice', 'energy_bill'];
    const receivedFields = Object.keys(req.files);

    const invalidFields = receivedFields.filter(field => !allowedFields.includes(field));

    if (invalidFields.length > 0) {
        return res.status(400).json({
            success: false,
            error: `Campos inválidos: ${invalidFields.join(', ')}`,
            allowed: allowedFields
        });
    }

    next();
};

module.exports = {
    validateCreateClient: validate(createClientSchema),
    validateUpdateClient: validate(updateClientSchema),
    validateUpdateFlagStatus: validate(updateFlagStatusSchema),
    validatePublicCheck: validateQuery(publicCheckSchema),
    validateDocumentUpdate
};