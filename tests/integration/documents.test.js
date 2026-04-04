require('dotenv').config({ path: '.env.test' });
const {
  app, request,
  createAdminAndLogin,
  cleanDatabase,
} = require('../setup/testHelpers');

describe('Documents API', () => {
  let adminToken, documentId;

  beforeAll(async () => {
    await cleanDatabase();
    const admin = await createAdminAndLogin();
    adminToken = admin.token;
    // Para testes reais, seria necessário criar um documento via onboarding ou updateClient.
    // O teste abaixo verifica apenas autenticação e 404.
  });

  describe('GET /api/v1/documents/:id/download', () => {
    it('requer autenticação', async () => {
      const res = await request(app).get('/api/v1/documents/any-id/download');
      expect(res.status).toBe(401);
    });

    it('retorna 404 para documento inexistente', async () => {
      const res = await request(app)
        .get('/api/v1/documents/00000000-0000-0000-0000-000000000000/download')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(404);
    });
  });
});