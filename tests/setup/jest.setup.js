const { sequelize } = require('../../src/infrastructure/repositories/models');

beforeAll(async () => {
  // Garante que a conexão está aberta
  await sequelize.authenticate();
});

afterAll(async () => {
  await sequelize.close();
});