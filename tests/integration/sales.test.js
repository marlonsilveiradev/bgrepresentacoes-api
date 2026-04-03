require('dotenv').config({ path: '.env.test' });
const {
  app, request,
  createAdminAndLogin,
  cleanDatabase,
} = require('../setup/testHelpers');

describe('Sales API', () => {
  let adminToken;

  beforeAll(async () => {
    await cleanDatabase();
    const admin = await createAdminAndLogin();
    adminToken = admin.token;
  });

  describe('GET /api/v1/sales', () => {
    it('requer autenticação', async () => {
      const res = await request(app).get('/api/v1/sales');
      expect(res.status).toBe(401);
    });

    it('admin acessa listagem', async () => {
      const res = await request(app)
        .get('/api/v1/sales')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
    });
  });
});