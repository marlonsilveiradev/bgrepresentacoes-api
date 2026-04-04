require('dotenv').config({ path: '.env.test' });
const {
  app, request,
  createAdminAndLogin, createUserAndLogin,
  cleanDatabase,
} = require('../setup/testHelpers');

describe('Users API', () => {
  let adminToken;

  beforeAll(async () => {
    await cleanDatabase();
    const admin = await createAdminAndLogin();
    adminToken = admin.token;
  });

  // ─────────────────────────────────────────────────────────────
  // GET /api/v1/users
  // ─────────────────────────────────────────────────────────────
  describe('GET /api/v1/users', () => {
    it('admin lista usuários com sucesso', async () => {
      const res = await request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body).toHaveProperty('pagination');
    });

    it('retorna 401 sem token', async () => {
      const res = await request(app).get('/api/v1/users');
      expect(res.status).toBe(401);
    });

    it('vendedor não pode listar usuários (403)', async () => {
      const { token } = await createUserAndLogin();
      const res = await request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(403);
    });

    it('resposta não contém campo password', async () => {
      const res = await request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`);
      res.body.data.forEach(user => {
        expect(user).not.toHaveProperty('password');
      });
    });
  });

  // ─────────────────────────────────────────────────────────────
  // POST /api/v1/users (criar usuário)
  // ─────────────────────────────────────────────────────────────
  describe('POST /api/v1/users', () => {
    // Usamos beforeEach para garantir um banco limpo antes de cada teste de criação
    beforeEach(async () => {
      await cleanDatabase();
      // Recria o admin após limpeza
      const admin = await createAdminAndLogin();
      adminToken = admin.token;
    });

    it('admin cria usuário com sucesso', async () => {
      const res = await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Novo Vendedor',
          email: 'novo@teste.com',
          role: 'user',
        });
      expect(res.status).toBe(201);
      expect(res.body.data.user.email).toBe('novo@teste.com');
      expect(res.body.data).toHaveProperty('temporaryPassword');
      expect(res.body.data.user).not.toHaveProperty('password');
    });

    it('rejeita email duplicado (409)', async () => {
      const payload = { name: 'Duplicado', email: 'duplicado@teste.com', role: 'user' };
      await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload);
      const res = await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload);
      expect(res.status).toBe(409);
    });

    it('rejeita role inválido', async () => {
      const res = await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Teste', email: 'x@teste.com', role: 'superadmin' });
      expect(res.status).toBe(422);
    });

    it('rejeita campos extras (noUnknown)', async () => {
      const res = await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Teste',
          email: 'y@teste.com',
          role: 'user',
          is_admin: true,
        });
      expect(res.status).toBe(422);
    });
  });
});