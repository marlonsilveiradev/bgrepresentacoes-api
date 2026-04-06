const Sequelize = require('sequelize');
const path = require('path');
const config = require('../config/database');
const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  dbConfig
);

const db = {};

// O caminho real dos seus modelos conforme a auditoria:
// src/infrastructure/repositories/models
const modelsPath = path.join(__dirname, '..', 'repositories', 'models');

// Importação manual garantindo que o Node ache os arquivos
db.User = require(path.join(modelsPath, 'User'))(sequelize);
db.RefreshToken = require(path.join(modelsPath, 'RefreshToken'))(sequelize);
db.Flag = require(path.join(modelsPath, 'Flag'))(sequelize);
db.Client = require(path.join(modelsPath, 'Client'))(sequelize);
db.ClientFlag = require(path.join(modelsPath, 'ClientFlag'))(sequelize);
db.ClientDocument = require(path.join(modelsPath, 'ClientDocument'))(sequelize);
db.ClientBankAccount = require(path.join(modelsPath, 'ClientBankAccount'))(sequelize);
db.Sale = require(path.join(modelsPath, 'Sale'))(sequelize);
db.SaleFlag = require(path.join(modelsPath, 'SaleFlag'))(sequelize);
db.Machine = require(path.join(modelsPath, 'Machine'))(sequelize);
db.Plan = require(path.join(modelsPath, 'Plan'))(sequelize);
db.PlanFlag = require(path.join(modelsPath, 'PlanFlag'))(sequelize);

// Associações
Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;