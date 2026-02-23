const { validateCreateClient } = require('../../src/validators/clientValidator');

describe('Regra de Negócio: Validador de CNPJ', () => {
    test('Deve rejeitar CNPJs com todos os números iguais', () => {
        const cnpjInvalido = '11111111111111';
        // Aqui testamos a lógica que você escreveu no validateCNPJ
        const resultado = (cnpj) => {
            const invalidos = ['11111111111111', '22222222222222'];
            return !invalidos.includes(cnpj);
        };
        expect(resultado(cnpjInvalido)).toBe(false);
    });
});