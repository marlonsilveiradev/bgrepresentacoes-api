require('dotenv').config();
const app = require('./config/app');
const config = require('./config/config');
const { sequelize } = require('./models');
const logger = require('./config/logger');

const PORT = config.port || 3000;

async function startServer() {
  try {
    // 1. Autentica a conexão com o banco de dados
    await sequelize.authenticate();
    logger.info('Conexão com o banco de dados estabelecida com sucesso.');
    
    // 2. Inicia o servidor Express
    app.listen(PORT, () => {
      logger.info(`Servidor rodando na porta ${PORT}`);
      logger.info(`Documentação Swagger disponível em: http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
  logger.fatal({ err: error }, 'Falha crítica ao iniciar o servidor.');
  process.exit(1);
}
}

const shutdown = async (signal) => {
  logger.info(`${signal} recebido. Encerrando servidor...`);
  server.close(async () => {
    await sequelize.close();
    logger.info('Servidor encerrado com sucesso.');
    process.exit(0);
  });
  // Force exit se demorar mais de 10s
  setTimeout(() => process.exit(1), 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'uncaughtException — encerrando processo.');
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.fatal({ reason }, 'unhandledRejection — encerrando processo.');
  process.exit(1);
});

startServer();