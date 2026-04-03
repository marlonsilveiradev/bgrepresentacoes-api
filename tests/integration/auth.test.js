require('dotenv').config({ path: '.env.test' });
const {
  app, request,
  createAdminAndLogin,
  cleanDatabase,
  User
} = require('../setup/testHelpers');
const { v4: uuidv4 } = require('uuid');

describe('Auth — POST /api/v1/auth/login', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  it('faz login com credenciais corretas', async () => {
    const password = 'Senha@Forte123';
    await User.create({
      id: uuidv4(),
      name: 'Teste Login',
      email: 'login@teste.com',
      password: password, // texto puro, hook faz hash
      role: 'admin',
      is_active: true,
      last_login_at: new Date(),
    });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'login@teste.com', password });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data).toHaveProperty('token');
    expect(res.body.data).toHaveProperty('refreshToken');
    expect(res.body.data).not.toHaveProperty('password');
  });

  it('retorna 401 com email incorreto', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'nao@existe.com', password: 'qualquer' });

    expect(res.status).toBe(401);
  });

  it('retorna 401 com senha incorreta', async () => {
    const password = 'SenhaCorreta@1';
    await User.create({
      id: uuidv4(),
      name: 'Outro',
      email: 'outro@teste.com',
      password: password,
      role: 'user',
      is_active: true,
      last_login_at: new Date(),
    });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'outro@teste.com', password: 'SenhaErrada@1' });

    expect(res.status).toBe(401);
    // Mensagem genérica de segurança
    expect(res.body.message).toMatch(/E-mail ou senha incorretos/);
  });

  it('retorna 422 com email inválido', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'nao-e-email', password: '123' });

    expect(res.status).toBe(422);
  });

  it('força troca de senha no primeiro login (last_login_at null)', async () => {
    const password = 'Primeiro@Acesso1';
    await User.create({
      id: uuidv4(),
      name: 'Primeiro Acesso',
      email: 'primeiro@teste.com',
      password: password,
      role: 'user',
      is_active: true,
      last_login_at: null,
    });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'primeiro@teste.com', password });

    expect(res.status).toBe(200);
    expect(res.body.data.mustChangePassword).toBe(true);
  });

  it('retorna 403 para usuário desativado', async () => {
    const password = 'Desativado@1';
    await User.create({
      id: uuidv4(),
      name: 'Desativado',
      email: 'desativado@teste.com',
      password: password,
      role: 'user',
      is_active: false,
      last_login_at: new Date(),
    });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'desativado@teste.com', password });

    expect(res.status).toBe(403);
  });
});

describe('Auth — POST /api/v1/auth/refresh', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  it('renova o token com refresh token válido', async () => {
    const { token, refreshToken } = await createAdminAndLogin();
    await new Promise(resolve => setTimeout(resolve, 1000));
    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('token');
    expect(res.body.data.token).not.toBe(token);
  });

  it('retorna 401 com refresh token inválido', async () => {
    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: 'token.invalido.aqui' });

    expect(res.status).toBe(401);
  });
});

describe('Auth — POST /api/v1/auth/logout', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  it('realiza logout e invalida o refresh token', async () => {
    const { token, refreshToken } = await createAdminAndLogin();

    const logoutRes = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${token}`)
      .send({ refreshToken });

    expect(logoutRes.status).toBe(200);

    const refreshRes = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken });

    expect(refreshRes.status).toBe(401);
  });
});