// require('dotenv').config();

// // Função auxiliar para construir as opções SSL
// function getDialectOptions() {
//   // Se não houver DATABASE_URL, não usa SSL (ambiente local)
//   if (!process.env.DATABASE_URL) return {};

//   const sslOptions = {
//     require: true,
//     rejectUnauthorized: true,  // agora com validação
//   };

//   // Se houver uma variável DB_CA_CERT (conteúdo do certificado), adiciona
//   if (process.env.DB_CA_CERT) {
//     sslOptions.ca = process.env.DB_CA_CERT;
//   }

//   return {
//     ssl: sslOptions,
//   };
// }

// const dbConfig = {
//   // Prioriza a URL completa (Railway/VPS), senão monta com as variáveis (Docker)
//   url: process.env.DATABASE_URL || null,
//   username: process.env.DB_USER || 'postgres',
//   password: process.env.DB_PASSWORD || 'postgres',
//   database: process.env.DB_NAME || 'bgrepresentacoes',
//   host: process.env.DB_HOST || 'localhost',
//   port: Number.parseInt(process.env.DB_PORT, 10) || 5432,
//   dialect: process.env.DB_DIALECT || 'postgres',
//   logging: false,
//   define: {
//     timestamps: true,
//     underscored: true,
//     underscoredAll: true,
//   },
//   // Configuração crucial para Railway/VPS:
//   dialectOptions: getDialectOptions(),
// };

// module.exports = {
//   development: dbConfig,
//   production: dbConfig,
//   test: dbConfig
// };

require('dotenv').config();

function getDialectOptions() {
  if (!process.env.DATABASE_URL) return {};

  const sslOptions = {
    require: true,
    rejectUnauthorized: true,
  };

  if (process.env.DB_CA_CERT) {
    sslOptions.ca = process.env.DB_CA_CERT;
  }

  return { ssl: sslOptions };
}

// Configurações comuns (Timestamps, etc)
const commonConfig = {
  dialect: process.env.DB_DIALECT || 'postgres',
  logging: false,
  define: {
    timestamps: true,
    underscored: true,
    underscoredAll: true,
  },
  dialectOptions: getDialectOptions(),
};

module.exports = {
  development: {
    ...commonConfig,
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'bgrepresentacoes',
    host: process.env.DB_HOST || 'localhost',
    port: Number.parseInt(process.env.DB_PORT, 10) || 5432,
  },
  test: {
    ...commonConfig,
    // No ambiente de teste, as variáveis virão do .env.test injetado pelo dotenv-cli
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: Number.parseInt(process.env.DB_PORT, 10) || 5433,
  },
  production: {
    ...commonConfig,
    url: process.env.DATABASE_URL,
    dialectOptions: getDialectOptions(), // Garante SSL em produção
  }
};