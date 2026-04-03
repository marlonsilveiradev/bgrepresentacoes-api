require('dotenv').config({ path: '.env.test' });
const {
  app, request,
  createAdminAndLogin, createUserAndLogin,
  cleanDatabase,
} = require('../setup/testHelpers');

describe('Segurança — Autenticação', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  it('rotas protegidas retornam 401 sem token', async () => {
    const protectedRoutes = [
      { method: 'get', path: '/api/v1/users' },
      { method: 'get', path: '/api/v1/clients' },
      { method: 'get', path: '/api/v1/sales' },
    ];

    for (const route of protectedRoutes) {
      const res = await request(app)[route.method](route.path);
      expect(res.status).toBe(401);
    }
  });

  it('rotas públicas não exigem token', async () => {
    const publicRoutes = [
      { method: 'get', path: '/api/v1/flags' },
      { method: 'get', path: '/api/v1/plans' },
    ];

    for (const route of publicRoutes) {
      const res = await request(app)[route.method](route.path);
      expect(res.status).not.toBe(401);
    }
  });

  it('token expirado/inválido retorna 401', async () => {
    const res = await request(app)
      .get('/api/v1/users')
      .set('Authorization', 'Bearer token.invalido.aqui');
    expect(res.status).toBe(401);
  });

  it('rota pública de rastreamento não precisa de token', async () => {
    const res = await request(app)
      .get('/api/v1/clients/public/track/PROTO-0001');
    expect(res.status).toBe(404); // não 401
    expect(res.status).not.toBe(401);
  });
});

describe('Segurança — Autorização por Role', () => {
  let adminToken, userToken;

  beforeEach(async () => {
    await cleanDatabase();
    const admin = await createAdminAndLogin();
    adminToken = admin.token;
    const user = await createUserAndLogin();
    userToken = user.token;
  });

  it('vendedor não acessa rota de admin /users', async () => {
    const res = await request(app)
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(403);
  });

  it('admin acessa rota /users', async () => {
    const res = await request(app)
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });
});

describe('Segurança — Injeção de campos', () => {
  let adminToken;

  beforeEach(async () => {
    await cleanDatabase();
    const admin = await createAdminAndLogin();
    adminToken = admin.token;
  });

  it('criação de usuário ignora campos não permitidos', async () => {
    const res = await request(app)
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Teste Inject',
        email: 'inject@teste.com',
        role: 'user',
        is_active: false,
        password: 'hacker',
      });

    // Deve retornar 422 por causa do campo extra 'is_active' e 'password'
    // ou, se o schema permitir, retornar 201 mas com valores padrão.
    if (res.status === 201) {
      expect(res.body.data.is_active).toBe(true);
    } else {
      expect(res.status).toBe(422);
    }
  });
});