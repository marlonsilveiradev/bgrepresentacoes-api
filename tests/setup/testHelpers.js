require('dotenv').config({ path: '.env.test' });

const request = require('supertest');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const app = require('../../src/infrastructure/config/app');

const { 
  User, 
  Client, 
  Flag, 
  Plan, 
  Sale, 
  ClientFlag,
  sequelize 
} = require('../../src/infrastructure/repositories/models');

// ─── Helpers para criar dados de teste ────────────────────────────────────────

async function createAdminAndLogin() {
  const password = 'Admin@Teste123';
  const email = `admin_${uuidv4()}@teste.com`;

  const admin = await User.create({
    id: uuidv4(),
    name: 'Admin Teste',
    email: email,
    password: password, // texto puro, o hook fará o hash
    role: 'admin',
    is_active: true,
    last_login_at: new Date(),
  });

  const loginResponse = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: admin.email, password });

  if (loginResponse.status !== 200) {
    console.error('❌ Falha no login de setup:', loginResponse.body);
    throw new Error(`Setup falhou: Status ${loginResponse.status}`);
  }

  return {
    user: admin,
    token: loginResponse.body.data.token,
    refreshToken: loginResponse.body.data.refreshToken,
  };
}

async function createUserAndLogin() {
  const password = 'User@Teste123';
  const email = `user_${uuidv4()}@teste.com`;

  const user = await User.create({
    id: uuidv4(),
    name: 'Vendedor Teste',
    email: email,
    password: password,
    role: 'user',
    is_active: true,
    last_login_at: new Date(),
  });

  const loginResponse = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: user.email, password });

  if (loginResponse.status !== 200) {
    console.error('❌ Falha no login de setup:', loginResponse.body);
    throw new Error(`Setup falhou: Status ${loginResponse.status}`);
  }

  return {
    user,
    token: loginResponse.body.data.token,
  };
}

async function createFlag(overrides = {}) {
  return Flag.create({
    id: uuidv4(),
    name: `Flag Teste ${uuidv4().slice(0, 8)}`,
    description: 'Bandeira para testes',
    price: 89.90,
    is_active: true,
    ...overrides,
  });
}

async function createPlan(flagIds = []) {
  const plan = await Plan.create({
    id: uuidv4(),
    name: `Plano Teste ${uuidv4().slice(0, 8)}`,
    description: 'Plano para testes',
    price: 199.90,
    is_active: true,
  });

  if (flagIds.length > 0) {
    await plan.setFlags(flagIds);
  }

  return plan;
}

async function cleanDatabase() {
  await sequelize.query('SET session_replication_role = replica;');
  
  const tables = [
    'sale_flags', 'sales', 'client_flags', 'client_documents',
    'client_bank_accounts', 'clients', 'plan_flags', 'plans',
    'flags', 'refresh_tokens', 'users', 'machines'
  ];
  
  for (const table of tables) {
    await sequelize.query(`DELETE FROM "${table}"`);
  }
  
  await sequelize.query('SET session_replication_role = DEFAULT;');
}

module.exports = {
  app,
  request,
  createAdminAndLogin,
  createUserAndLogin,
  createFlag,
  createPlan,
  cleanDatabase,
  sequelize,
  User,
  Client,
  Flag,
  Plan,
};