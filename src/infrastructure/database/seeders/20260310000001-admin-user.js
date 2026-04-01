'use strict';

const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    // Lê a senha do ambiente, com fallback seguro (mas NÃO use fallback em produção)
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword) {
      throw new Error('ADMIN_PASSWORD não definida. Defina no .env ou nas variáveis de ambiente.');
    }
    const password = await bcrypt.hash(adminPassword, 12);

    await queryInterface.bulkInsert('users', [
      {
        id: uuidv4(),
        name: process.env.ADMIN_NAME || 'Administrador',
        email: process.env.ADMIN_EMAIL || 'admin@bgrepresentacoes.com.br',
        password,
        role: 'admin',
        is_active: true,
        last_login_at: null,
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: null,
      },
    ]);
  },

  async down(queryInterface) {
    // Use a mesma variável para excluir, se necessário
    await queryInterface.bulkDelete('users', { email: process.env.ADMIN_EMAIL || 'admin@bgrepresentacoes.com.br' });
  },
};