// src/utils/validateEnv.js
// ============================================================
// Valida variáveis de ambiente obrigatórias na inicialização.
// Se qualquer variável crítica estiver ausente, o servidor
// para imediatamente com uma mensagem clara de erro.
// ============================================================

'use strict';

// Lista de variáveis que DEVEM existir para a aplicação funcionar.
// Se qualquer uma estiver indefinida ou vazia, o servidor não sobe.
const REQUIRED_VARS = [
  // Autenticação JWT
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',

  // Banco de dados
  'DB_HOST',
  'DB_NAME',
  'DB_USER',
  'DB_PASSWORD',

  // Cloudinary (armazenamento de documentos dos clientes)
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
];

// Comprimento mínimo dos secrets JWT.
// Um segredo curto pode ser quebrado por força bruta.
const JWT_MIN_LENGTH = 32;

function validateEnv() {
  const errors = [];

  // 1. Verifica se cada variável obrigatória existe e não está vazia
  REQUIRED_VARS.forEach((key) => {
    const value = process.env[key];
    if (!value || value.trim() === '') {
      errors.push(`  ✗ ${key} — não definida ou está vazia`);
    }
  });

  // 2. Verifica o comprimento mínimo dos secrets JWT
  //    Só verifica se a variável existe (evita erro duplicado)
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

  // 3. Verifica se NODE_ENV tem um valor válido
  const validEnvs = ['development', 'test', 'production'];
  if (process.env.NODE_ENV && !validEnvs.includes(process.env.NODE_ENV)) {
    errors.push(
      `  ✗ NODE_ENV — valor inválido: "${process.env.NODE_ENV}". Use: development, test ou production`
    );
  }

  // 4. Se encontrou algum problema, exibe tudo e para o servidor
  if (errors.length > 0) {
    console.error('\n========================================================');
    console.error('  ERRO FATAL: Variáveis de ambiente inválidas ou ausentes');
    console.error('========================================================');
    errors.forEach((msg) => console.error(msg));
    console.error('========================================================');
    console.error('  O servidor foi encerrado. Corrija o .env e tente novamente.\n');
    process.exit(1); // Código 1 = encerramento com erro (o PM2 vai registrar isso)
  }

  // 5. Se tudo estiver correto, registra no console que a validação passou
  console.info(`[validateEnv] Todas as variáveis obrigatórias estão presentes. NODE_ENV=${process.env.NODE_ENV || 'não definido'}`);
}

module.exports = validateEnv;