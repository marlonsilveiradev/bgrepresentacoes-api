const { generateToken, verifyToken } = require('../../src/utils/jwt');

describe('Utils - JWT', () => {
    const mockUser = { id: 1, email: 'teste@teste.com', role: 'admin', name: 'Admin' };

    test('Deve gerar um token string válido', () => {
        const token = generateToken(mockUser);
        expect(typeof token).toBe('string');
    });

    test('Deve validar um token gerado corretamente', () => {
        const token = generateToken(mockUser);
        const decoded = verifyToken(token);
        expect(decoded.email).toBe(mockUser.email);
        expect(decoded.role).toBe(mockUser.role);
    });
});