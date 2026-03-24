const { Sequelize } = require('sequelize');
const dbConfig = require('../config/database');
const appConfig = require('../config/config');
const logger = require('../config/logger');

const env = appConfig.env;
const config = dbConfig[env];

const sequelize = config.use_env_variable
  ? new Sequelize(process.env[config.use_env_variable], {
    dialect: config.dialect,
    logging: config.logging,
    pool: config.pool,
    define: config.define,
    dialectOptions: config.dialectOptions || {},
  })
  : new Sequelize(
    config.database,
    config.username,
    config.password,
    {
      host: config.host,
      port: config.port,
      dialect: config.dialect,
      logging: config.logging,
      pool: config.pool,
      define: config.define,
      dialectOptions: config.dialectOptions || {},
    }
  );
// Import models
const RefreshToken = require('./RefreshToken')(sequelize);
const User = require('./User')(sequelize);
const Client = require('./Client')(sequelize);
const Flag = require('./Flag')(sequelize);
const Plan = require('./Plan')(sequelize);
const PlanFlag = require('./PlanFlag')(sequelize);
const ClientFlag = require('./ClientFlag')(sequelize);
const ClientDocument = require('./ClientDocument')(sequelize);
const ClientBankAccount = require('./ClientBankAccount')(sequelize);
const Sale = require('./Sale')(sequelize);
const SaleFlag = require('./SaleFlag')(sequelize);

const db = {
  sequelize,
  Sequelize,
  RefreshToken,
  User,
  Client,
  Flag,
  Plan,
  PlanFlag,
  ClientFlag,
  ClientDocument,
  ClientBankAccount,
  Sale,
  SaleFlag,
};

// Run associations
Object.values(db).forEach((model) => {
  if (model && typeof model.associate === 'function') {
    model.associate(db);
  }
});

// Test connection
sequelize
  .authenticate()
  .then(() => logger.info('Conexão com banco de dados estabelecida.'))
  .catch((err) => logger.error({ err }, 'Erro ao conectar ao banco de dados.'));

module.exports = db;
