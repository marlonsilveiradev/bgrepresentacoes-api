// Ajuste o número de ../ conforme a sua pasta real
const { generateProtocol, validateProtocol } = require('../../src/utils/protocolGenerator');

describe('Utils - Protocol Generator', () => {
    test('Deve gerar um protocolo no formato YYYYMMDD-XXXXXX', () => {
        const protocol = generateProtocol();
        // Verifica o formato usando a própria função de validação que você criou
        expect(validateProtocol(protocol)).toBe(true);
    });

    test('Deve ter 15 caracteres (8 data + 1 traço + 6 aleatórios)', () => {
        const protocol = generateProtocol();
        expect(protocol).toHaveLength(15);
    });
});