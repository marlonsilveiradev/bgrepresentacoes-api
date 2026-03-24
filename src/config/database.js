require('dotenv').config();

module.exports = {
  development: {
    username: process.env.DB_USER     || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME     || 'bgrepresentacoes',
    host:     process.env.DB_HOST     || 'localhost',
    port:     parseInt(process.env.DB_PORT, 10) || 5432,
    dialect:  process.env.DB_DIALECT  || 'postgres',
    logging:  false,
    pool: {
      max:     10,
      min:     2,
      acquire: 30000,
      idle:    10000,
    },
    define: {
      timestamps:  true,
      underscored: true,
      paranoid:    false,
    },
  },

  test: {
    username: process.env.DB_USER     || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME_TEST || 'bgrepresentacoes_test',
    host:     process.env.DB_HOST     || 'localhost',
    port:     parseInt(process.env.DB_PORT, 10) || 5432,
    dialect:  process.env.DB_DIALECT  || 'postgres',
    logging:  false,
    pool: {
      max: 5, min: 1, acquire: 30000, idle: 10000,
    },
    define: {
      timestamps:  true,
      underscored: true,
      paranoid:    false,
    },
  },

  production: {
  use_env_variable: 'DATABASE_URL',
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: { require: true, rejectUnauthorized: false },
  },
  pool: {
    max: 10, min: 2, acquire: 30000, idle: 10000,
  },
  define: {
    timestamps: true, underscored: true, paranoid: false,
  },
},
};
