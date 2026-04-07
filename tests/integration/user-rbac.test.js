const { 
  app, 
  request, 
  createAdminAndLogin, 
  createUserAndLogin, 
  cleanDatabase,
  sequelize,
  User 
} = require('../setup/testHelpers');
const { v4: uuidv4 } = require('uuid');

describe('User Routes - Full Coverage Test', () => {
  let adminData;
  let partnerData;
  let targetUserId;

  beforeAll(async () => {
    await cleanDatabase();
    adminData = await createAdminAndLogin();
    partnerData = await createUserAndLogin();
  });

  afterAll(async () => {
    await cleanDatabase();
    await sequelize.close();
  });

  describe('Self-service: Perfil Próprio', () => {
    test('GET /profile - Deve retornar dados do próprio usuário', async () => {
      const res = await request(app)
        .get('/api/v1/users/profile')
        .set('Authorization', `Bearer ${partnerData.token}`);

      expect(res.status).toBe(200);
    });

    test('PATCH /profile - Deve permitir alterar nome, CPF e endereço', async () => {
      const res = await request(app)
        .patch('/api/v1/users/profile')
        .set('Authorization', `Bearer ${partnerData.token}`)
        .send({ 
          name: 'Marlon Dev',
          cpf: '123.456.789-00',
          address_city: 'Porto Alegre',
          address_state: 'RS',
          address_zip: '90000-000'
        });

      expect(res.status).toBe(200);
    });

    test('PATCH /profile/change-password - Deve permitir trocar senha', async () => {
      const res = await request(app)
        .patch('/api/v1/users/profile/change-password')
        .set('Authorization', `Bearer ${partnerData.token}`)
        .send({
          currentPassword: 'User@Teste123',
          newPassword: 'NovoPassword@123' // Deve passar no STRONG_PASSWORD_REGEX
        });

      expect(res.status).toBe(200);
    });
  });

  describe('Administração de Usuários (RBAC)', () => {
    test('POST / - Admin deve criar novo usuário', async () => {
      const res = await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminData.token}`)
        .send({
          name: 'Vendedor Teste',
          email: `vendedor_${uuidv4()}@sistema.com`,
          role: 'user'
        });

      expect(res.status).toBe(201);
      targetUserId = res.body.data.user.id;
    });

    test('GET / - Admin deve listar usuários com paginação', async () => {
      const res = await request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${adminData.token}`);

      expect(res.status).toBe(200);
    });

    test('GET /:id - Admin deve buscar usuário por UUID', async () => {
      const res = await request(app)
        .get(`/api/v1/users/${targetUserId}`)
        .set('Authorization', `Bearer ${adminData.token}`);

      expect(res.status).toBe(200);
    });

    test('PATCH /:id - Admin deve atualizar dados (respeitando o validator)', async () => {
      const res = await request(app)
        .patch(`/api/v1/users/${targetUserId}`)
        .set('Authorization', `Bearer ${adminData.token}`)
        .send({ 
          // Removido 'name' pois seu updateUserSchema não aceita!
          email: `updated_${uuidv4()}@sistema.com`, 
          role: 'partner',
          is_active: true
        });

      expect(res.status).toBe(200);
    });

    test('PATCH /:id/deactivate - Admin deve desativar usuário', async () => {
      const res = await request(app)
        .patch(`/api/v1/users/${targetUserId}/deactivate`)
        .set('Authorization', `Bearer ${adminData.token}`);

      expect(res.status).toBe(200);
    });

    test('PATCH /:id/reactivate - Admin deve reativar usuário', async () => {
      const res = await request(app)
        .patch(`/api/v1/users/${targetUserId}/reactivate`)
        .set('Authorization', `Bearer ${adminData.token}`);

      expect(res.status).toBe(200);
    });
  });

  describe('Proteções e Middlewares', () => {
    test('Deve bloquear acesso sem Token (401)', async () => {
      const res = await request(app).get('/api/v1/users/profile');
      expect(res.status).toBe(401);
    });

    test('Deve validar Schema no POST (422)', async () => {
      const res = await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminData.token}`)
        .send({ email: 'invalido' });

      expect(res.status).toBe(422);
    });
  });
});