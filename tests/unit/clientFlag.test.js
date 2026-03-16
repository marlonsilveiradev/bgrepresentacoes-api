const request = require('supertest');
const app = require('../../src/config/app'); // Importa seu app express

describe('Testes na Rota de Client Flags', () => {
  it('Deve retornar 401 se tentar atualizar status sem token', async () => {
    const response = await request(app)
      .patch('/api/v1/client-flags/id-qualquer/status')
      .send({ status: 'approved' });

    expect(response.status).toBe(401);
  });
});