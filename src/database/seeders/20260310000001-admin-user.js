'use strict';

const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const password = await bcrypt.hash('@BgAPI@2026@', 12);

    await queryInterface.bulkInsert('users', [
      {
        id: uuidv4(),
        name: 'Administrador',
        email: 'admin@bgrepresentacoes.com.br',
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
    await queryInterface.bulkDelete('users', { email: 'admin@valealimentacao.com.br' });
  },
};