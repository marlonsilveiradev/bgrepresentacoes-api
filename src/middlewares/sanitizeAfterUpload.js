/**
 * MIDDLEWARE DE SANITIZAÇÃO PÓS-UPLOAD
 * 
 * Sanitiza dados DEPOIS que o Multer processa multipart/form-data
 */

/**
 * Remove tags HTML e caracteres perigosos
 */
function sanitizeString(str) {
    if (typeof str !== 'string') return str;

    try {
        // Remove tags HTML completas
        str = str.replace(/<[^>]*>/g, '');

        // Remove caracteres perigosos para XSS
        str = str.replace(/[<>"%;()&+]/g, '');

        // Remove quebras de linha e tabs extras
        str = str.replace(/[\r\n\t]+/g, ' ');

        // Remove espaços múltiplos
        str = str.replace(/\s+/g, ' ');

        // Trim
        str = str.trim();

        return str;
    } catch (error) {
        console.error('Erro ao sanitizar string:', error);
        return str;
    }
}

/**
 * Sanitiza objeto recursivamente
 */
function sanitizeObject(obj) {
    if (obj === null || obj === undefined) {
        return obj;
    }

    if (typeof obj !== 'object') {
        return sanitizeString(obj);
    }

    if (Array.isArray(obj)) {
        return obj.map(item => sanitizeObject(item));
    }

    // Usa Object.keys ao invés de for...in com hasOwnProperty
    const sanitized = {};
    Object.keys(obj).forEach(key => {
        sanitized[key] = sanitizeObject(obj[key]);
    });

    return sanitized;
}

/**
 * Middleware principal
 */
function sanitizeAfterUpload(req, res, next) {
    try {
        // Sanitiza req.body (dados do form)
        if (req.body && typeof req.body === 'object') {
            const sanitizedBody = {};

            // Usa Object.keys para evitar problemas com hasOwnProperty
            Object.keys(req.body).forEach(key => {
                sanitizedBody[key] = sanitizeObject(req.body[key]);
            });

            req.body = sanitizedBody;
        }

        // Sanitiza req.query (query params)
        if (req.query && typeof req.query === 'object') {
            const sanitizedQuery = {};

            Object.keys(req.query).forEach(key => {
                sanitizedQuery[key] = sanitizeObject(req.query[key]);
            });

            req.query = sanitizedQuery;
        }

        // Sanitiza req.params (route params)
        if (req.params && typeof req.params === 'object') {
            const sanitizedParams = {};

            Object.keys(req.params).forEach(key => {
                sanitizedParams[key] = sanitizeObject(req.params[key]);
            });

            req.params = sanitizedParams;
        }

        next();
    } catch (error) {
        console.error('Erro crítico ao sanitizar dados:', error);
        // Em caso de erro, passa adiante sem bloquear
        next();
    }
}

module.exports = { sanitizeAfterUpload };