/**
 * Repositories - Índice centralizado
 * ✅ CORRIGIDO: Lógica híbrida para instâncias e classes
 */
const db = require('./models');

// Importação das Classes/Instâncias
const FlagRepository = require('./FlagRepository');
const UserRepository = require('./UserRepository');
const RefreshTokenRepository = require('./RefreshTokenRepository');
const ReportRepository = require('./ReportRepository');
const StorageRepository = require('./StorageRepository');

// Repositórios para Onboarding
const ClientRepository = require('./ClientRepository');
const PlanRepository = require('./PlanRepository');
const ClientFlagRepository = require('./ClientFlagRepository');
const ClientBankAccountRepository = require('./ClientBankAccountRepository');
const ClientDocumentRepository = require('./ClientDocumentRepository');

// Função auxiliar para garantir a injeção do model apenas se necessário
const ensureInstance = (Repo, model = null) => {
  // Se Repo for uma função/classe, instanciamos
  if (typeof Repo === 'function') {
    return model ? new Repo(model) : new Repo();
  }
  // Se já for uma instância, apenas retornamos
  return Repo;
};

module.exports = {
  // ─── Repositórios Core ─────────────────────────────────────────────────────
  userRepository: ensureInstance(UserRepository, db.User),
  refreshTokenRepository: ensureInstance(RefreshTokenRepository, db.RefreshToken),
  flagRepository: ensureInstance(FlagRepository, db.Flag),
  
  // Aqui é onde dava o erro do ReportRepository:
  reportRepository: ensureInstance(ReportRepository), 
  storageRepository: ensureInstance(StorageRepository),

  // ─── Repositórios de Onboarding ───────────────────────────────────────────
  clientRepository: ensureInstance(ClientRepository, db.Client),
  planRepository: ensureInstance(PlanRepository, db.Plan),
  clientFlagRepository: ensureInstance(ClientFlagRepository, db.ClientFlag),
  clientBankAccountRepository: ensureInstance(ClientBankAccountRepository, db.ClientBankAccount),
  clientDocumentRepository: ensureInstance(ClientDocumentRepository, db.ClientDocument),
};