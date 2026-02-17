/**
 * INICIALIZAÇÃO DO SERVIDOR
 */

const app = require('./app');
const { sequelize } = require('./models');
const { createInitialAdmin } = require('./utils/createAdminUser');

const PORT = process.env.PORT || 3000;

/**
 * Inicia o servidor
 */
async function startServer() {
    try {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🚀 Iniciando Card Flags System...');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        // 1. Testa conexão com banco
        console.log('🔍 Testando conexão com banco de dados...');
        await sequelize.authenticate();
        console.log('✅ Conexão estabelecida!');

        // 2. Sincroniza modelos
        console.log('🔄 Sincronizando modelos...');
        await sequelize.sync({
            alter: process.env.NODE_ENV === 'development'
        });
        console.log('✅ Modelos sincronizados!');

        // 3. Cria admin inicial
        console.log('👤 Verificando administrador inicial...');
        await createInitialAdmin();

        // 4. Inicia servidor HTTP
        const server = app.listen(PORT, () => {
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log(`🚀 Servidor rodando na porta ${PORT}`);
            console.log(`📍 URL: http://localhost:${PORT}`);
            console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        });

        // Graceful shutdown
        process.on('SIGTERM', () => {
            console.log('⚠️  SIGTERM recebido. Encerrando...');
            server.close(async () => {
                await sequelize.close();
                console.log('✅ Servidor encerrado');
                process.exit(0);
            });
        });

        process.on('SIGINT', () => {
            console.log('⚠️  SIGINT recebido. Encerrando...');
            server.close(async () => {
                await sequelize.close();
                console.log('✅ Servidor encerrado');
                process.exit(0);
            });
        });

    } catch (error) {
        console.error('❌ Erro ao iniciar servidor:', error);
        process.exit(1);
    }
}

// Inicia servidor
startServer();