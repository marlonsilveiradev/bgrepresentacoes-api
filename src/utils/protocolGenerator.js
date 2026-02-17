/**
 * GERADOR DE PROTOCOLO
 * 
 * Formato: YYYYMMDD-XXXXXX
 * Exemplo: 20240211-847392
 */

function generateProtocol() {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    const datePart = `${year}${month}${day}`;
    const randomPart = Math.floor(100000 + Math.random() * 900000);

    return `${datePart}-${randomPart}`;
}

function validateProtocol(protocol) {
    const protocolRegex = /^\d{8}-\d{6}$/;
    return protocolRegex.test(protocol);
}

module.exports = {
    generateProtocol,
    validateProtocol
};