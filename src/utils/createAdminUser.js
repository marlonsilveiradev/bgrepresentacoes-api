/**
 * CRIAÇÃO DO ADMIN INICIAL
 */

const { User } = require('../models');

async function createInitialAdmin() {
    try {
        const existingAdmin = await User.findOne({
            where: { role: 'admin' }
        });

        if (existingAdmin) {
            console.log('✅ Administrador já existe');
            return;
        }

        const adminData = {
            name: process.env.ADMIN_NAME,
            email: process.env.ADMIN_EMAIL.toLocaleLowerCase(),
            password: process.env.ADMIN_PASSWORD,
            role: 'admin',
            is_active: true,
            created_by: null
        };


        const admin = await User.create(adminData);

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✅ Admin criado com sucesso!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📧 Email:', admin.email);
        console.log('🔑 Senha:', adminData.password);
        console.log('⚠️  TROQUE A SENHA APÓS PRIMEIRO LOGIN!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    } catch (error) {
        console.error('❌ Erro ao criar admin:', error.message);
    }
}

module.exports = { createInitialAdmin };