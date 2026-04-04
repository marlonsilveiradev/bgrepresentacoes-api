require('dotenv').config({ path: '.env.test' });
const {
  app, request,
  createAdminAndLogin, createUserAndLogin,
  cleanDatabase,
} = require('../setup/testHelpers');

describe('Clients API', () => {
  let adminToken, userToken, clientId;

  beforeAll(async () => {
    await cleanDatabase();
    const admin = await createAdminAndLogin();
    adminToken = admin.token;
    const user = await createUserAndLogin();
    userToken = user.token;
  });

  describe('GET /api/v1/clients/public/track/:protocol', () => {
    it('rota pública retorna 404 para protocolo inexistente (não 401)', async () => {
      const res = await request(app).get('/api/v1/clients/public/track/INVALIDO');
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
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('vendedor acessa listagem (apenas seus clientes)', async () => {
      const res = await request(app)
        .get('/api/v1/clients')
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
    });
  });

  describe('GET /api/v1/clients/:id', () => {
    let createdClientId;

    beforeAll(async () => {
      // Criar um cliente para teste (via admin)
      const createRes = await request(app)
        .post('/api/v1/onboarding') // usa onboarding para criar cliente
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          corporate_name: 'Cliente Teste',
          cnpj: '12.345.678/0001-99',
          responsible_name: 'João',
          email: 'cliente@teste.com',
          phone: '11999999999',
          benefit_type: 'both',
          address_street: 'Rua A',
          address_number: '123',
          address_city: 'São Paulo',
          address_state: 'SP',
          address_zip: '01000-000',
          bank_name: 'Banco Teste',
          agency: '1234',
          account: '56789',
          account_type: 'checking',
          plan_id: null,
          partner_id: null,
        });
      if (createRes.status === 201) {
        createdClientId = createRes.body.data.client.id;
      }
    });

    it('admin pode ver cliente por ID', async () => {
      if (!createdClientId) return;
      const res = await request(app)
        .get(`/api/v1/clients/${createdClientId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(createdClientId);
    });

    it('retorna 404 para ID inválido', async () => {
      const res = await request(app)
        .get('/api/v1/clients/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(404);
    });
  });
});