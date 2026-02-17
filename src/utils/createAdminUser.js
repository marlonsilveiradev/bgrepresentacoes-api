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
            name: process.env.ADMIN_NAME || 'Administrador',
            email: process.env.ADMIN_EMAIL || 'admin@cardflags.com',
            password: process.env.ADMIN_PASSWORD || 'Admin@123456',
            role: 'admin',
            is_active: true,
            created_by: null
        };

        if (adminData.email === 'admin@cardflags.com' && adminData.password === 'Admin@123456') {
            console.warn('⚠️  ATENÇÃO: Usando credenciais padrão!');
            console.warn('⚠️  Configure ADMIN_EMAIL e ADMIN_PASSWORD no .env');
        }

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