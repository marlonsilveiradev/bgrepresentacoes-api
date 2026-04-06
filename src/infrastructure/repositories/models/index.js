/**
 * SEQUELIZE MODELS INDEX
 * 
 * Responsabilidade: Centralizar a inicialização de todos os modelos Sequelize
 * 
 * Fluxo:
 * 1. Inicializar conexão Sequelize
 * 2. Criar objeto db vazio (crucial para resolv circular dependencies)
 * 3. Importar todos os modelos (injetar sequelize)
 * 4. EXPORTAR o objeto db (antes das associações)
 * 5. Executar associações entre modelos
 * 6. Testar conexão
 * 7. Validar modelos carregados
 */

const { Sequelize } = require('sequelize');

const dbConfig = require('../../config/database');

const appConfig = require('../../config/config');

const logger = require('../../config/logger');

// ─── PASSO 1: Validar ambiente e configuração ───────────────────────────────

const env = appConfig.env || 'development';

const config = dbConfig[env];

if (!config) {
  logger.error(`[Models] Configuração não encontrada para ambiente: ${env}`);
  throw new Error(`Database config not found for environment: ${env}`);
}

logger.info(`[Models] Inicializando conexão para ambiente: ${env}`);

// ─── PASSO 2: Inicializar Sequelize ─────────────────────────────────────────

const sequelize = config.use_env_variable
  ? new Sequelize(process.env[config.use_env_variable], {
      dialect: config.dialect,
      logging: config.logging,
      pool: config.pool,
      define: config.define,
      dialectOptions: config.dialectOptions || {},
    })
  : new Sequelize(
      config.database,
      config.username,
      config.password,
      {
        host: config.host,
        port: config.port,
        dialect: config.dialect,
        logging: config.logging,
        pool: config.pool,
        define: config.define,
        dialectOptions: config.dialectOptions || {},
      }
    );

// ─── PASSO 3: Criar objeto db (CRUCIAL para circular dependencies) ──────────

const db = {};

// ─── PASSO 4: Importar modelos (injetar sequelize) ─────────────────────────

db.RefreshToken = require('./RefreshToken')(sequelize);
db.User = require('./User')(sequelize);
db.Client = require('./Client')(sequelize);
db.Flag = require('./Flag')(sequelize);
db.Plan = require('./Plan')(sequelize);
db.PlanFlag = require('./PlanFlag')(sequelize);
db.ClientFlag = require('./ClientFlag')(sequelize);
db.ClientDocument = require('./ClientDocument')(sequelize);
db.ClientBankAccount = require('./ClientBankAccount')(sequelize);
db.Sale = require('./Sale')(sequelize);
db.SaleFlag = require('./SaleFlag')(sequelize);
db.Machine = require('./Machine')(sequelize);

// ─── PASSO 5: Adicionar classes de suporte ──────────────────────────────────

db.sequelize = sequelize;
db.Sequelize = Sequelize;

// ─── PASSO 6: EXPORTAÇÃO ANTECIPADA (Crucial!) ───────────────────────────────

/**
 * IMPORTANTE: Exportamos aqui ANTES das associações.
 * 
 * Quando um model tenta fazer `require('./index')` dentro de sua função `associate`,
 * ele já encontrará este objeto db COMPLETO (com todos os modelos).
 * 
 * Se exportássemos DEPOIS das associações, teríamos undefined references.
 */

module.exports = db;

// ─── PASSO 7: Executar associações entre modelos ──────────────────────────

/**
 * Iterar apenas sobre os modelos (não sequelize, Sequelize)
 * Chamar o método associate de cada um, passando o objeto db
 */

Object.keys(db).forEach((modelName) => {
  if (db[modelName] && typeof db[modelName].associate === 'function') {
    try {
      db[modelName].associate(db);
      logger.debug(`[Models] Associações carregadas: ${modelName}`);
    } catch (error) {
      logger.error(
        { error },
        `[Models] Erro ao carregar associações de ${modelName}`
      );
    }
  }
});

// ─── PASSO 8: Teste de conexão (Assíncrono) ─────────────────────────────────

/**
 * Não bloqueamos a inicialização da aplicação se a BD falhar.
 * Apenas registramos o erro para que seja visível nos logs.
 * 
 * Em um ambiente enterprise, você pode querer fazer process.exit(1) aqui.
 */

sequelize
  .authenticate()
  .then(() => {
    logger.info('[Models] Conexão com banco de dados estabelecida com sucesso.');
  })
  .catch((err) => {
    logger.error(
      { error: err.message },
      '[Models] ERRO CRÍTICO: Falha ao conectar ao banco de dados.'
    );
    // Descomente em produção se quiser encerrar:
    // process.exit(1);
  });

// ─── PASSO 9: Health Check de Models ─────────────────────────────────────────

/**
 * Útil para debug e monitoramento
 * Retorna lista de modelos carregados
 */

const getLoadedModels = () => {
  return Object.keys(db).filter(
    (key) => key !== 'sequelize' && key !== 'Sequelize'
  );
};

/**
 * Validar se todos os modelos esperados foram carregados
 * Executa na inicialização e pode ser usado em health checks
 */

const validateModels = () => {
  const loaded = getLoadedModels();
  
  logger.info(
    `[Models] ✅ ${loaded.length} modelos carregados: ${loaded.join(', ')}`
  );

  const expected = [
    'RefreshToken',
    'User',
    'Client',
    'Flag',
    'Plan',
    'PlanFlag',
    'ClientFlag',
    'ClientDocument',
    'ClientBankAccount',
    'Sale',
    'SaleFlag',
    'Machine',
  ];

  const missing = expected.filter((model) => !loaded.includes(model));

  if (missing.length > 0) {
    logger.warn(
      `[Models] ⚠️ Modelos não carregados: ${missing.join(', ')}`
    );
  }
};

// Executar validação
validateModels();

// Adicionar funções de health check ao objeto db
db.getLoadedModels = getLoadedModels;
db.validateModels = validateModels;

// ─── FIM ─────────────────────────────────────────────────────────────────────

/**
 * RESUMO DO FLUXO:
 * 
 * 1. Validar configuração do ambiente
 * 2. Inicializar Sequelize
 * 3. Criar objeto db vazio
 * 4. Importar TODOS os modelos (injetar sequelize)
 * 5. Adicionar sequelize e Sequelize ao objeto db
 * 6. **EXPORTAR O OBJETO DB** (antes das associações)
 * 7. Executar associações entre modelos
 * 8. Testar conexão com o banco
 * 9. Validar modelos carregados
 * 
 * RESULTADO: Circular dependencies resolvidas, modelos prontos para uso
 */