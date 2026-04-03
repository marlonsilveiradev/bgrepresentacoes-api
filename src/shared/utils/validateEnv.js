// src/utils/validateEnv.js
// ============================================================
// Valida variáveis de ambiente obrigatórias na inicialização.
// Se qualquer variável crítica estiver ausente, o servidor
// para imediatamente com uma mensagem clara de erro.
// ============================================================

'use strict';

const { logger } = require("sequelize/lib/utils/logger");

const JWT_MIN_LENGTH = 32;

function validateEnv() {
  const errors = [];
  const isProduction = process.env.NODE_ENV === 'production';

  // ── 1. Variáveis obrigatórias em QUALQUER ambiente ──────────────────────────
  const ALWAYS_REQUIRED = [
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
  ];

  ALWAYS_REQUIRED.forEach((key) => {
    const value = process.env[key];
    if (!value || value.trim() === '') {
      errors.push(`  ✗ ${key} — não definida ou está vazia`);
    }
  });

  // ── 2. Variáveis de banco — lógica diferente por ambiente ───────────────────
  //
  // RAILWAY (production): usa uma única string DATABASE_URL gerada automaticamente
  //   pela plataforma. As variáveis DB_HOST, DB_NAME etc. não existem lá.
  //
  // VPS (production): quando você migrar para VPS, terá duas opções:
  //   OPÇÃO A — Continue usando DATABASE_URL: configure essa variável na VPS
  //             manualmente (ex: postgresql://user:pass@localhost:5432/dbname)
  //             e não precisa mudar nada aqui.
  //   OPÇÃO B — Use variáveis individuais: comente o bloco do Railway abaixo,
  //             descomente o bloco VPS logo abaixo dele, e ajuste o database.js
  //             de produção para não usar use_env_variable.
  //
  // DESENVOLVIMENTO (development/test): usa DB_HOST, DB_NAME, DB_USER, DB_PASSWORD
  //   definidas no seu .env local.

  if (isProduction) {
    // ── RAILWAY ── (ou VPS com DATABASE_URL configurada manualmente)
    // Comente este bloco quando migrar para VPS com variáveis individuais (Opção B)
    if (!process.env.DATABASE_URL || process.env.DATABASE_URL.trim() === '') {
      errors.push('  ✗ DATABASE_URL — obrigatória em produção (gerada automaticamente pelo Railway)');
    }

    // ── VPS com variáveis individuais ── (Opção B)
    // Descomente este bloco e comente o bloco DATABASE_URL acima quando migrar para VPS
    // ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'].forEach((key) => {
    //   const value = process.env[key];
    //   if (!value || value.trim() === '') {
    //     errors.push(`  ✗ ${key} — não definida ou está vazia`);
    //   }
    // });

  } else {
    // ── DESENVOLVIMENTO / TESTES ── usa variáveis individuais do .env local
    ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'].forEach((key) => {
      const value = process.env[key];
      if (!value || value.trim() === '') {
        errors.push(`  ✗ ${key} — não definida ou está vazia`);
      }
    });
  }

  // ── 3. Comprimento mínimo dos secrets JWT ───────────────────────────────────
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < JWT_MIN_LENGTH) {
    errors.push(
      `  ✗ JWT_SECRET — muito curto (${process.env.JWT_SECRET.length} chars). Mínimo: ${JWT_MIN_LENGTH}`
    );
  }

  if (process.env.JWT_REFRESH_SECRET && process.env.JWT_REFRESH_SECRET.length < JWT_MIN_LENGTH) {
    errors.push(
      `  ✗ JWT_REFRESH_SECRET — muito curto (${process.env.JWT_REFRESH_SECRET.length} chars). Mínimo: ${JWT_MIN_LENGTH}`
    );
  }

  // ── 4. NODE_ENV deve ter um valor reconhecido ───────────────────────────────
  const validEnvs = ['development', 'test', 'production'];
  if (process.env.NODE_ENV && !validEnvs.includes(process.env.NODE_ENV)) {
    errors.push(
      `  ✗ NODE_ENV — valor inválido: "${process.env.NODE_ENV}". Use: development, test ou production`
    );
  }

  // ── 5. Encerra o servidor se houver qualquer erro ───────────────────────────
  if (errors.length > 0) {
    console.error('\n========================================================');
    console.error('  ERRO FATAL: Variáveis de ambiente inválidas ou ausentes');
    console.error('========================================================');
    errors.forEach((msg) => console.error(msg));
    console.error('========================================================');
    console.error('  O servidor foi encerrado. Corrija as variáveis e tente novamente.\n');
    process.exit(1);
  }

  console.info(
    `[validateEnv] OK — NODE_ENV=${process.env.NODE_ENV || 'não definido'} | ` +
    `banco=${isProduction ? 'DATABASE_URL' : 'variáveis individuais'}`
  );
}

module.exports = validateEnv;