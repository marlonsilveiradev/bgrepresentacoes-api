/**
 * CONFIGURAÇÃO DO BANCO DE DADOS
 * 
 * Este arquivo configura a conexão com o PostgreSQL.
 * O Sequelize usa estas configurações para se conectar.
 */

require('dotenv').config();

module.exports = {
    // Configuração para desenvolvimento (seu computador)
    development: {
        username: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: 'postgres',
        logging: console.log,

        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        },

        timezone: '-03:00'
    },

    // Configuração para produção (VPS)
    production: {
        username: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: 'postgres',
        logging: false,

        pool: {
            max: 10,
            min: 2,
            acquire: 30000,
            idle: 10000
        },

        timezone: '-03:00'
    }
};