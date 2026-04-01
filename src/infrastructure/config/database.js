// 

require('dotenv').config();

const dbConfig = {
  // Prioriza a URL completa (Railway/VPS), senão monta com as variáveis (Docker)
  url: process.env.DATABASE_URL || null,
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'bgrepresentacoes',
  host: process.env.DB_HOST || 'localhost',
  port: Number.parseInt(process.env.DB_PORT, 10) || 5432,
  dialect: process.env.DB_DIALECT || 'postgres',
  logging: false,
  define: {
    timestamps: true,
    underscored: true,
    underscoredAll: true,
  },
  // Configuração crucial para Railway/VPS:
  dialectOptions: process.env.DATABASE_URL ? {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  } : {},
};

module.exports = {
  development: dbConfig,
  production: dbConfig,
  test: dbConfig
};