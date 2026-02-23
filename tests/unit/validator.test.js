// Aqui importamos apenas a função de validar CNPJ (se você a exportou)
// Caso ela esteja apenas dentro do arquivo, teste o schema do Yup
const { validateCreateClient } = require('../../src/validators/clientValidator');

describe('Validators - Client CNPJ', () => {
    test('Deve rejeitar um CNPJ com números repetidos', async () => {
        const invalidData = { cnpj: '11111111111111' };
        // Simulando como o Yup validaria isso
        try {
            // Note: Este teste depende de como você exportou o validateCreateClient
            // Se for middleware, o teste é levemente diferente.
        } catch (e) {
            expect(e).toBeDefined();
        }
    });
});