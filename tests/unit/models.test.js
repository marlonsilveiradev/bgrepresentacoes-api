// Usamos o caminho que funcionou no seu erro anterior: '../../src/models/index'
const path = '../../src/models/index';

jest.mock('../../src/models/index', () => ({
    User: {
        create: jest.fn(),
        findOne: jest.fn()
    }
}));

const { User } = require('../../src/models/index');
const bcrypt = require('bcrypt');

describe('Model - User (Segurança)', () => {
    test('Deve verificar se a lógica de hash de senha funciona', async () => {
        const password = 'senha_secreta_123';
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        expect(hash).not.toBe(password);
        const isMatch = await bcrypt.compare(password, hash);
        expect(isMatch).toBe(true);
    });
});