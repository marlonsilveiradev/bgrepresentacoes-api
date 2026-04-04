require('dotenv').config({ path: '.env.test' });
const {
  app, request,
  createAdminAndLogin,
  cleanDatabase,
} = require('../setup/testHelpers');

describe('Client Flags API', () => {
  let adminToken, clientFlagId;

  beforeAll(async () => {
    await cleanDatabase();
    const admin = await createAdminAndLogin();
    adminToken = admin.token;

    // Criar um cliente e uma bandeira associada (client_flag)
    // (depende do seu fluxo de onboarding – simplificado aqui)
    // Para teste real, seria necessário criar um cliente e depois uma flag.
    // Vamos pular a criação detalhada e testar apenas a rota de atualização de status.
    // O teste abaixo assume que você terá um clientFlagId válido.
    // Para simplificar, podemos criar via API de onboarding com plano ou flag_ids.
  });

  describe('PATCH /api/v1/client-flags/:id/status', () => {
    it('requer autenticação', async () => {
      const res = await request(app)
        .patch('/api/v1/client-flags/00000000-0000-0000-0000-000000000000/status')
        .send({ status: 'approved' });
      expect(res.status).toBe(401);
    });

    it('retorna 404 para vínculo inexistente', async () => {
      const res = await request(app)
        .patch('/api/v1/client-flags/00000000-0000-0000-0000-000000000000/status')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'approved' });
      expect(res.status).toBe(404);
    });

    // Teste real depende da criação de um clientFlag – pode ser feito via onboarding.
    // Exemplo:
    // it('admin atualiza status com sucesso', async () => {
    //   const res = await request(app)
    //     .patch(`/api/v1/client-flags/${clientFlagId}/status`)
    //     .set('Authorization', `Bearer ${adminToken}`)
    //     .send({ status: 'approved' });
    //   expect(res.status).toBe(200);
    // });
  });
});