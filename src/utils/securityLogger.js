/**
 * LOGGER DE SEGURANÇA
 */

const fs = require('fs').promises;
const path = require('path');

/**
 * Detecta possível ataque XSS
 */
function detectXSS(text) {
    if (typeof text !== 'string') return false;

    const xssPatterns = [
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        /javascript:/gi,
        /onerror\s*=/gi,
        /onload\s*=/gi,
        /onclick\s*=/gi,
        /<iframe/gi,
        /<object/gi,
        /<embed/gi
    ];

    return xssPatterns.some(pattern => pattern.test(text));
}

/**
 * Detecta possível SQLi
 */
function detectSQLi(text) {
    if (typeof text !== 'string') return false;

    const sqliPatterns = [
        /(\s|^)(union|select|insert|update|delete|drop|create|alter|exec|execute)(\s|$)/gi,
        /--/g,
        /;(\s)*drop/gi,
        /'\s*or\s*'1'\s*=\s*'1/gi,
        /admin'\s*--/gi
    ];

    return sqliPatterns.some(pattern => pattern.test(text));
}

/**
 * Loga tentativa de ataque
 */
async function logSecurityEvent(type, data, req) {
    try {
        // Proteção extra: se req não existir, define valores padrão
        const logEntry = {
            timestamp: new Date().toISOString(),
            type: type,
            ip: req?.ip || 'unknown',
            user: req?.user ? req.user.id : 'anonymous',
            url: req?.originalUrl || 'unknown',
            method: req?.method || 'unknown',
            data: data
        };

        const logDir = path.join(__dirname, '../../logs');
        const logFile = path.join(logDir, 'security.log');

        try {
            await fs.mkdir(logDir, { recursive: true });
            await fs.appendFile(logFile, JSON.stringify(logEntry) + '\n', 'utf8');
        } catch (err) {
            console.error('Erro ao gravar arquivo de log:', err.message);
        }

        // CORREÇÃO DA LINHA 80: Uso de Optional Chaining (?.) para evitar o erro 500
        console.warn(`⚠️  TENTATIVA DE ATAQUE ${type} DETECTADA:`, {
            ip: logEntry?.ip,
            user: logEntry?.user,
            url: logEntry?.url
        });

    } catch (error) {
        // Catch final para NUNCA deixar esta função derrubar a requisição
        console.error('Falha crítica no logger de segurança:', error.message);
    }
}

/**
 * Verifica string recursivamente de forma síncrona para evitar erros de fluxo
 */
function checkValueSync(value) {
    if (typeof value !== 'string') return false;

    // Retorna verdadeiro se detectar QUALQUER um dos dois ataques
    return detectXSS(value) || detectSQLi(value);
}

/**
 * Middleware que detecta, loga e BLOQUEIA ataques
 */

function securityMonitor(req, res, next) {
    try {
        let attackDetected = false;
        let suspiciousField = '';
        let suspiciousValue = '';

        // Varredura simples no body
        if (req.body && typeof req.body === 'object') {
            for (const [key, value] of Object.entries(req.body)) {
                // Se o valor for string, verifica. Se for objeto/array, ignora para simplificar o bloqueio
                if (typeof value === 'string' && checkValueSync(value)) {
                    attackDetected = true;
                    suspiciousField = key;
                    suspiciousValue = value;
                    break;
                }
            }
        }

        if (attackDetected) {
            // Dispara o log em segundo plano (sem await para não causar 500 se o log falhar)
            const type = detectXSS(suspiciousValue) ? 'XSS' : 'SQLi';
            logSecurityEvent(type, { field: suspiciousField, value: suspiciousValue }, req)
                .catch(err => console.error('Erro ao registrar log:', err.message));

            // INTERRUPÇÃO OBRIGATÓRIA: Retorna 400 e impede que chegue ao Controller
            return res.status(400).json({
                success: false,
                error: 'Atividade maliciosa detectada (tags script/HTML). A requisição foi bloqueada por segurança.'
            });
        }

        // Se não detectou nada, segue para o próximo middleware/controller
        next();
    } catch (error) {
        console.error('Erro crítico no monitor de segurança:', error);
        // Em caso de erro no próprio monitor, retornamos 400 por precaução
        return res.status(400).json({ success: false, error: 'Erro na validação de segurança' });
    }
}

module.exports = {
    detectXSS,
    detectSQLi,
    logSecurityEvent,
    checkValueSync,
    securityMonitor
};