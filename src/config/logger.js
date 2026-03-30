// ============================================================
// src/config/logger.js
// Logger Pino + alertas por e-mail em erros críticos
// ============================================================

'use strict';

const pino       = require('pino');
const nodemailer = require('nodemailer');

const isProd = process.env.NODE_ENV === 'production';

// ── 1. Transportador SMTP ─────────────────────────────────────────────────────

const mailTransport = nodemailer.createTransport({
  host:   process.env.SMTP_HOST,
  port:   Number.parseInt(process.env.SMTP_PORT || '587', 10),
  secure: false, // porta 587 usa STARTTLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  connectionTimeout: 10000, // 10 segundos de timeout
  greetingTimeout: 10000,
  tls: {
    servername: process.env.SMTP_HOST, // Ajuda com certificados
    socketOptions: { family: 4 }, // Força o uso de IPv4 para evitar o erro ENETUNREACH
  }
});

// ── 2. Verificação de conexão SMTP na inicialização ───────────────────────────
// Roda em background — não bloqueia o boot do servidor.
// Se falhar, imprime o erro no console para aparecer nos logs do Railway.
if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
  mailTransport.verify((error) => {
    if (error) {
      // Este console.error aparece nos logs do Railway mesmo sem Pino
      console.error('[logger] SMTP verify FALHOU — e-mails de alerta não serão enviados.');
      console.error('[logger] Detalhe:', error.message);
      console.error('[logger] Verifique SMTP_HOST, SMTP_PORT, SMTP_USER e SMTP_PASS no Railway.');
    } else {
      console.info('[logger] SMTP conectado com sucesso. Alertas por e-mail ativos.');
    }
  });
} else {
  console.warn('[logger] Variáveis SMTP não configuradas. Alertas por e-mail desativados.');
}

// ── 3. Configuração do Logger Pino ────────────────────────────────────────────

const logger = isProd
  ? pino({ level: process.env.LOG_LEVEL || 'info' })
  : pino({
      level: process.env.LOG_LEVEL || 'info',
      transport: {
        target: 'pino-pretty',
        options: {
          colorize:      true,
          translateTime: 'SYS:standard',
          ignore:        'pid,hostname',
        },
      },
    });

// ── 4. Envio de e-mail de alerta ──────────────────────────────────────────────

const EMAIL_INTERVAL = 5 * 60 * 1000; // mínimo 5 min entre e-mails
let lastEmailTime    = 0;

const sendAlertEmail = (subject, body) => {
  // Não tenta enviar se as variáveis não estão configuradas
  if (!process.env.SMTP_HOST || !process.env.ALERT_EMAIL_TO) return;

  const now = Date.now();
  if (now - lastEmailTime < EMAIL_INTERVAL) return;
  lastEmailTime = now;

  const text = typeof body === 'object'
    ? JSON.stringify(body, null, 2)
    : String(body);

  mailTransport.sendMail({
    from:    process.env.ALERT_EMAIL_FROM || process.env.SMTP_USER,
    to:      process.env.ALERT_EMAIL_TO,
    subject: `[BG Representações API] ${subject}`,
    text,
  }).then(() => {
    // Confirma no log do Railway que o e-mail saiu
    console.info(`[logger] E-mail de alerta enviado: "${subject}"`);
  }).catch((err) => {
    // Erro de envio aparece nos logs do Railway
    console.error('[logger] Falha ao enviar e-mail de alerta:', err.message);
    console.error('[logger] Código do erro SMTP:', err.code);
    // Reseta o timer para tentar novamente na próxima ocorrência
    lastEmailTime = 0;
  });
};

// ── 5. Sobrescrita dos métodos de log críticos ────────────────────────────────
// logger.error → e-mail genérico de erro
// logger.fatal → e-mail com prioridade máxima

const originalError = logger.error.bind(logger);
const originalFatal = logger.fatal.bind(logger);

logger.error = function (obj, msg, ...args) {
  const subject = obj?.type ?? 'Erro na API';
  const body    = (obj && typeof obj === 'object')
    ? { ...obj, msg, timestamp: new Date().toISOString() }
    : { msg: obj, timestamp: new Date().toISOString() };

  sendAlertEmail(subject, body);
  return originalError(obj, msg, ...args);
};

logger.fatal = function (obj, msg, ...args) {
  const subject = 'FATAL — Servidor em risco';
  const body    = (obj && typeof obj === 'object')
    ? { ...obj, msg, timestamp: new Date().toISOString() }
    : { msg: obj, timestamp: new Date().toISOString() };

  sendAlertEmail(subject, body);
  return originalFatal(obj, msg, ...args);
};

module.exports = logger;