require('dotenv').config({ path: '.env.test' });
const {
  app, request,
  createAdminAndLogin, createUserAndLogin,
  cleanDatabase,
} = require('../setup/testHelpers');

describe('Plans API', () => {
  let adminToken, userToken, planId;

  beforeAll(async () => {
    await cleanDatabase();
    const admin = await createAdminAndLogin();
    adminToken = admin.token;
    const user = await createUserAndLogin();
    userToken = user.token;
  });

  describe('GET /api/v1/plans (público)', () => {
    it('não precisa de token', async () => {
      const res = await request(app).get('/api/v1/plans');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('POST /api/v1/plans (admin)', () => {
    it('admin cria plano', async () => {
      const res = await request(app)
        .post('/api/v1/plans')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Plano Teste', price: 99.90 });
      expect(res.status).toBe(201);
      planId = res.body.data.id;
    });

    it('vendedor não pode criar plano (403)', async () => {
      const res = await request(app)
        .post('/api/v1/plans')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'Inválido', price: 10 });
      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/v1/plans/:id', () => {
    it('obtém plano por ID', async () => {
      if (!planId) return;
      const res = await request(app).get(`/api/v1/plans/${planId}`);
      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(planId);
    });
  });
});