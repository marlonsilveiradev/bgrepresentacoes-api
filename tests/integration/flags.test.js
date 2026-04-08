require('dotenv').config({ path: '.env.test' });
const {
  app, request,
  createAdminAndLogin, createUserAndLogin, createFlag,
  cleanDatabase,
} = require('../setup/testHelpers');

describe('Flags — Verificação de Proteção de Rotas', () => {

  it('NEGATIVO: deve falhar (401) ao listar flags sem token', async () => {
    // Note que NÃO enviamos o .set('Authorization', ...)
    const res = await request(app).get('/api/v1/flags');

    // Se sua rota estiver pública, res.status será 200 e o JEST VAI FALHAR aqui:
    expect(res.status).toBe(401); 
  });

  it('NEGATIVO: deve falhar (401) ao buscar flag por ID sem token', async () => {
    const res = await request(app).get('/api/v1/flags/00000000-0000-0000-0000-000000000000');
    
    expect(res.status).toBe(401);
  });
});

describe('Flags — Integração Protegida (Full Auth)', () => {
  let adminToken;
  let userToken;

  beforeEach(async () => {
    await cleanDatabase();
    
    const admin = await createAdminAndLogin();
    adminToken = admin.token;
    
    const user = await createUserAndLogin();
    userToken = user.token;
  });

  describe('Segurança de Acesso (Middlewares)', () => {
    it('deve retornar 401 ao listar flags sem token', async () => {
      const res = await request(app).get('/api/v1/flags');
      expect(res.status).toBe(401);
    });

    it('deve retornar 401 ao buscar flag por ID sem token', async () => {
      const res = await request(app).get('/api/v1/flags/any-uuid');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/v1/flags', () => {
    it('usuário autenticado (vendedor/user) pode listar bandeiras', async () => {
      await createFlag({ name: 'Visa', price: 10 });

      const res = await request(app)
        .get('/api/v1/flags')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeInstanceOf(Array);
    });

    it('deve filtrar corretamente por busca (search)', async () => {
      await createFlag({ name: 'Mastercard' });
      await createFlag({ name: 'Elo' });

      const res = await request(app)
        .get('/api/v1/flags?search=Master')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].name).toBe('Mastercard');
    });
  });

  describe('POST /api/v1/flags (Restrito Admin)', () => {
    it('admin cria bandeira com sucesso', async () => {
      const payload = { name: 'Ticket', description: 'Refeição', price: 80.50 };
      
      const res = await request(app)
        .post('/api/v1/flags')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('Ticket');
    });

    it('vendedor (user) recebe 403 ao tentar criar bandeira', async () => {
      const res = await request(app)
        .post('/api/v1/flags')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'Invasor', price: 10 });

      expect(res.status).toBe(403);
    });
  });

  describe('PATCH /api/v1/flags/:id', () => {
    it('deve atualizar apenas os campos enviados (parcial)', async () => {
      const flag = await createFlag({ name: 'Original', price: 100 });

      const res = await request(app)
        .patch(`/api/v1/flags/${flag.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ price: 150 });

      expect(res.status).toBe(200);
      expect(Number(res.body.data.price)).toBe(150);
      expect(res.body.data.name).toBe('Original'); // Manteve o nome
    });
  });

  describe('Ativação/Desativação', () => {
    it('deve alternar status da bandeira com sucesso', async () => {
      const flag = await createFlag({ name: 'Status Test', is_active: true });

      // Desativa
      const resDeactivate = await request(app)
        .patch(`/api/v1/flags/${flag.id}/deactivate`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(resDeactivate.status).toBe(200);

      // Reativa
      const resReactivate = await request(app)
        .patch(`/api/v1/flags/${flag.id}/reactivate`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(resReactivate.status).toBe(200);
    });
  });

  describe('Validações de Payload (Yup)', () => {
    it('deve retornar 422 se o preço for zero ou negativo', async () => {
      const res = await request(app)
        .post('/api/v1/flags')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Erro Preço', price: -5 });

      expect(res.status).toBe(422);
    });

    it('deve retornar 422 se o nome for curto demais', async () => {
      const res = await request(app)
        .post('/api/v1/flags')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'A', price: 10 });

      expect(res.status).toBe(422);
    });
  });
});