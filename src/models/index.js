/**
 * INICIALIZAÇÃO DOS MODELS
 */

const { Sequelize } = require('sequelize');
const config = require('../config/database');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    logging: dbConfig.logging,
    pool: dbConfig.pool,
    timezone: dbConfig.timezone,
    define: {
      timestamps: true,
      underscored: true,
      paranoid: false
    }
  }
);

const db = {};

// Importa todos os models
db.User = require('./User')(sequelize, Sequelize.DataTypes);
db.Plan = require('./Plan')(sequelize, Sequelize.DataTypes);
db.Flag = require('./Flag')(sequelize, Sequelize.DataTypes);
db.Client = require('./Client')(sequelize, Sequelize.DataTypes);
db.ClientFlag = require('./ClientFlag')(sequelize, Sequelize.DataTypes);
db.SalesReport = require('./SalesReport')(sequelize, Sequelize.DataTypes);

// Configura associações
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

/**
 * Testa conexão
 */
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexão com banco estabelecida!');
  } catch (error) {
    console.error('❌ Erro ao conectar:', error.message);
    process.exit(1);
  }
}

testConnection();

module.exports = db;