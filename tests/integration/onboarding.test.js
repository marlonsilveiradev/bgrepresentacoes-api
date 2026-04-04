require('dotenv').config({ path: '.env.test' });
const { app, request, createAdminAndLogin, cleanDatabase } = require('../setup/testHelpers');
const { Plan, Flag, User } = require('../../src/infrastructure/repositories/models');

describe('Onboarding API', () => {
  let adminToken;
  let planId;
  let partnerId;
  let flagId;

  beforeAll(async () => {
    await cleanDatabase();
    const admin = await createAdminAndLogin();
    adminToken = admin.token;

    // Criar parceiro (role = partner)
    const partner = await User.create({
      name: 'Parceiro Teste',
      email: 'parceiro@teste.com',
      password: 'Parceiro@123', // senha forte
      role: 'partner',
      is_active: true,
    });
    partnerId = partner.id;

    // Criar bandeira
    const flag = await Flag.create({
      name: 'Bandeira Teste',
      price: 10.0,
      is_active: true,
    });
    flagId = flag.id;

    // Criar plano e associar bandeira
    const plan = await Plan.create({
      name: 'Plano Teste',
      price: 99.90,
      is_active: true,
    });
    await plan.addFlag(flag);
    planId = plan.id;
  });

  afterAll(async () => {
    await cleanDatabase();
  });

  describe('POST /api/v1/onboarding', () => {
    it('deve criar cliente com sucesso (dados completos)', async () => {
      // Enviar como multipart/form-data usando .field()
      const res = await request(app)
        .post('/api/v1/onboarding')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('corporate_name', 'MARLON SISTEMAS LTDA')
        .field('responsible_name', 'Marlon Silveira')
        .field('cnpj', '47508411000156')           // apenas dígitos (válido)
        .field('phone', '11999999999')
        .field('email', 'contato@marlondev.com')
        .field('benefit_type', 'both')
        .field('address_street', 'Avenida Paulista')
        .field('address_number', '1000')
        .field('address_city', 'São Paulo')
        .field('address_state', 'SP')
        .field('address_zip', '01310100')
        .field('bank_name', 'Banco do Brasil')
        .field('agency', '1234')
        .field('account', '56789')
        .field('account_type', 'checking')
        .field('plan_id', planId)
        .field('partner_id', partnerId);

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.client).toHaveProperty('id');
      expect(res.body.data.sale).toHaveProperty('id');
    });

    it('deve falhar se não informar plano nem bandeiras', async () => {
      const res = await request(app)
        .post('/api/v1/onboarding')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('corporate_name', 'Empresa Teste')
        .field('responsible_name', 'João Silva')
        .field('cnpj', '12.345.678/0001-99')
        .field('phone', '11999999999')
        .field('email', 'teste@exemplo.com')
        .field('benefit_type', 'both')
        .field('address_street', 'Rua A')
        .field('address_number', '123')
        .field('address_city', 'São Paulo')
        .field('address_state', 'SP')
        .field('address_zip', '01000-000')
        .field('bank_name', 'Banco Teste')
        .field('agency', '1234')
        .field('account', '56789')
        .field('account_type', 'checking')
        .field('partner_id', partnerId);
        // plan_id e flag_ids omitidos

      expect(res.status).toBe(422);
      // A mensagem pode ser genérica "Dados inválidos" ou específica
      // Ajuste conforme seu validador
      expect(res.body.message).toMatch(/plano|bandeira|Dados inválidos/i);
    });
  });
});