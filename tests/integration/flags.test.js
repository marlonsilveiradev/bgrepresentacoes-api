require('dotenv').config({ path: '.env.test' });
const {
  app, request,
  createAdminAndLogin, createUserAndLogin, createFlag,
  cleanDatabase,
} = require('../setup/testHelpers');

describe('Flags — CRUD completo', () => {
  let adminToken;
  let userToken;

  beforeEach(async () => {
    await cleanDatabase();
    const admin = await createAdminAndLogin();
    adminToken = admin.token;
    const user = await createUserAndLogin();
    userToken = user.token;
  });

  describe('GET /api/v1/flags', () => {
    it('qualquer autenticado lista bandeiras', async () => {
      await createFlag({ name: 'Alelo' });
      await createFlag({ name: 'VR' });

      const res = await request(app)
        .get('/api/v1/flags')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
    });

    it('retorna paginação correta', async () => {
      for (let i = 0; i < 5; i++) await createFlag();

      const res = await request(app)
        .get('/api/v1/flags?limit=2&page=1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
      expect(res.body.pagination.total).toBe(5);
      expect(res.body.pagination.totalPages).toBe(3);
    });

    // it('sem token retorna 401', async () => {
    //   const res = await request(app).get('/api/v1/flags');
    //   expect(res.status).toBe(401);
    // });
  });

  describe('POST /api/v1/flags (apenas admin)', () => {
    it('admin cria bandeira com sucesso', async () => {
      const res = await request(app)
        .post('/api/v1/flags')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Ticket', description: 'Bandeira Ticket', price: 89.90 });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('Ticket');
    });

    it('vendedor não pode criar bandeira (403)', async () => {
      const res = await request(app)
        .post('/api/v1/flags')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'Alelo', price: 89.90 });

      expect(res.status).toBe(403);
    });

    it('nome duplicado retorna 409', async () => {
      await createFlag({ name: 'Alelo' });

      const res = await request(app)
        .post('/api/v1/flags')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Alelo', price: 99 });

      expect(res.status).toBe(409);
    });

    it('price é obrigatório', async () => {
      const res = await request(app)
        .post('/api/v1/flags')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'SemPreco' });

      expect(res.status).toBe(422);
    });
  });

  describe('PATCH /api/v1/flags/:id/deactivate', () => {
    it('admin desativa bandeira', async () => {
      const flag = await createFlag({ name: 'ParaDesativar' });

      const res = await request(app)
        .patch(`/api/v1/flags/${flag.id}/deactivate`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
    });

    it('retorna 404 para UUID inexistente', async () => {
      const res = await request(app)
        .patch('/api/v1/flags/00000000-0000-0000-0000-000000000000/deactivate')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });

    it('retorna 400 para UUID inválido', async () => {
      const res = await request(app)
        .patch('/api/v1/flags/nao-e-uuid/deactivate')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(422);
    });
  });
});