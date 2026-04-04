require('dotenv').config({ path: '.env.test' });
const {
  app, request,
  createAdminAndLogin, createUserAndLogin,
  cleanDatabase,
} = require('../setup/testHelpers');

describe('Reports API', () => {
  let adminToken, userToken;

  beforeAll(async () => {
    await cleanDatabase();
    const admin = await createAdminAndLogin();
    adminToken = admin.token;
    const user = await createUserAndLogin();
    userToken = user.token;
  });

  describe('GET /api/v1/reports/sales', () => {
    it('requer autenticação', async () => {
      const res = await request(app).get('/api/v1/reports/sales');
      expect(res.status).toBe(401);
    });

    it('requer role admin (403 para user)', async () => {
      const res = await request(app)
        .get('/api/v1/reports/sales')
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.status).toBe(403);
    });

    it('admin acessa relatório', async () => {
      const res = await request(app)
        .get('/api/v1/reports/sales')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('meta');
      expect(res.body).toHaveProperty('rows');
      expect(res.body).toHaveProperty('summary');
    });
  });
});