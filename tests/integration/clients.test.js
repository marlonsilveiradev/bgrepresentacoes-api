require('dotenv').config({ path: '.env.test' });
const {
  app, request,
  createAdminAndLogin,
  cleanDatabase,
} = require('../setup/testHelpers');

describe('Clients API', () => {
  let adminToken;

  beforeAll(async () => {
    await cleanDatabase();
    const admin = await createAdminAndLogin();
    adminToken = admin.token;
  });

  describe('GET /api/v1/clients/public/track/:protocol', () => {
    it('rota pública retorna 404 para protocolo inexistente (não 401)', async () => {
      const res = await request(app)
        .get('/api/v1/clients/public/track/INVALIDO');
      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/v1/clients', () => {
    it('requer autenticação', async () => {
      const res = await request(app).get('/api/v1/clients');
      expect(res.status).toBe(401);
    });

    it('admin acessa listagem', async () => {
      const res = await request(app)
        .get('/api/v1/clients')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
    });
  });
});