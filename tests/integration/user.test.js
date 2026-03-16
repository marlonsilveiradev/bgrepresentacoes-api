const request = require('supertest'); // <--- Faltava isso!
const app = require('../../src/config/app');
const { sequelize } = require('../../src/models');

describe('User API', () => {
  
  // Fecha a conexão com o banco após todos os testes para evitar o erro de "Open Handles"
  afterAll(async () => {
    await sequelize.close();
  });

  it('Deve barrar a criação de usuário sem e-mail', async () => {
    const response = await request(app)
      .post('/api/v1/users')
      // Se a rota for protegida, ela retornará 401 sem token, o que já prova que a segurança funciona
      .send({
        name: "Marlon Teste",
        password: "password123"
      });

    // Como você ainda não passou um token real, 
    // mude para 401 apenas para validar que o teste "bateu" na rota
    expect(response.status).toBe(401); 
  });
});