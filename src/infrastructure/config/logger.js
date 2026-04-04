// // ============================================================
// // src/infrastructure/config/logger.js
// // Logger Pino + alertas por e-mail em erros críticos
// // ============================================================

// 'use strict';

// const pino = require('pino');
// const nodemailer = require('nodemailer');

// const isProd = process.env.NODE_ENV === 'production';
// const isTest = process.env.NODE_ENV === 'test';

// let logger;

// if (isTest) {
//   // No ambiente de teste, usamos o Pino real mas no modo 'silent'
//   // Isso garante que métodos como .child() existam sem sujar o console
//   logger = pino({ level: 'silent' });
// } else {
//   // ── 1. Configuração do Logger Pino (Produção / Dev) ─────────────────────────
//   logger = isProd
//     ? pino({ level: process.env.LOG_LEVEL || 'info' })
//     : pino({
//         level: process.env.LOG_LEVEL || 'info',
//         transport: {
//           target: 'pino-pretty',
//           options: {
//             colorize: true,
//             translateTime: 'SYS:standard',
//             ignore: 'pid,hostname',
//           },
//         },
//       });

//   // ── 2. Transportador SMTP ───────────────────────────────────────────────────
//   const mailTransport = nodemailer.createTransport({
//     host: process.env.SMTP_HOST,
//     port: Number.parseInt(process.env.SMTP_PORT || '587', 10),
//     secure: false,
//     auth: {
//       user: process.env.SMTP_USER,
//       pass: process.env.SMTP_PASS,
//     },
//     connectionTimeout: 10000,
//     greetingTimeout: 10000,
//     tls: {
//       servername: process.env.SMTP_HOST,
//       socketOptions: { family: 4 },
//     },
//   });

//   // ── 3. Verificação de conexão SMTP ──────────────────────────────────────────
//   if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
//     mailTransport.verify((error) => {
//       if (error) {
//         console.error('[logger] SMTP verify FALHOU — e-mails de alerta não serão enviados.');
//         console.error('[logger] Detalhe:', error.message);
//       } else {
//         console.info('[logger] SMTP conectado com sucesso. Alertas por e-mail ativos.');
//       }
//     });
//   }

//   // ── 4. Lógica de Alertas por E-mail ─────────────────────────────────────────
//   const EMAIL_INTERVAL = 5 * 60 * 1000;
//   let lastEmailTime = 0;

//   const sendAlertEmail = (subject, body) => {
//     if (!process.env.SMTP_HOST || !process.env.ALERT_EMAIL_TO) return;

//     const now = Date.now();
//     if (now - lastEmailTime < EMAIL_INTERVAL) return;
//     lastEmailTime = now;

//     const text = typeof body === 'object' ? JSON.stringify(body, null, 2) : String(body);

//     mailTransport.sendMail({
//       from: process.env.ALERT_EMAIL_FROM || process.env.SMTP_USER,
//       to: process.env.ALERT_EMAIL_TO,
//       subject: `[BG Representações API] ${subject}`,
//       text,
//     }).then(() => {
//       console.info(`[logger] E-mail de alerta enviado: "${subject}"`);
//     }).catch((err) => {
//       console.error('[logger] Falha ao enviar e-mail de alerta:', err.message);
//       lastEmailTime = 0;
//     });
//   };

//   // ── 5. Sobrescrita de métodos para Alertas ──────────────────────────────────
//   const originalError = logger.error.bind(logger);
//   const originalFatal = logger.fatal.bind(logger);

//   logger.error = function (obj, msg, ...args) {
//     const subject = obj?.type ?? 'Erro na API';
//     const body = (obj && typeof obj === 'object')
//       ? { ...obj, msg, timestamp: new Date().toISOString() }
//       : { msg: obj, timestamp: new Date().toISOString() };

//     sendAlertEmail(subject, body);
//     return originalError(obj, msg, ...args);
//   };

//   logger.fatal = function (obj, msg, ...args) {
//     const subject = 'FATAL — Servidor em risco';
//     const body = (obj && typeof obj === 'object')
//       ? { ...obj, msg, timestamp: new Date().toISOString() }
//       : { msg: obj, timestamp: new Date().toISOString() };

//     sendAlertEmail(subject, body);
//     return originalFatal(obj, msg, ...args);
//   };
// }

// module.exports = logger;
// src/infrastructure/config/logger.js
'use strict';

const pino = require('pino');
const nodemailer = require('nodemailer');

const isProd = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';

if (isTest) {
  // Logger silencioso compatível com pino-http
  const silentLogger = pino({ level: 'silent' });
  module.exports = silentLogger;
} else {
  // ── Configuração SMTP (apenas fora de teste) ────────────────────────────────
  const smtpConfig = {
    host: process.env.SMTP_HOST,
    port: Number.parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    tls: {
      servername: process.env.SMTP_HOST,
      socketOptions: { family: 4 },
    },
  };

  let mailTransport = null;
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    mailTransport = nodemailer.createTransport(smtpConfig);
    mailTransport.verify((error) => {
      if (error) {
        console.error('[logger] SMTP verify FALHOU — e-mails de alerta não serão enviados.');
        console.error('[logger] Detalhe:', error.message);
      } else {
        console.info('[logger] SMTP conectado com sucesso. Alertas por e-mail ativos.');
      }
    });
  }

  // ── Logger Pino (configuração principal) ────────────────────────────────────
  const logger = isProd
    ? pino({ level: process.env.LOG_LEVEL || 'info' })
    : pino({
        level: process.env.LOG_LEVEL || 'info',
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        },
      });

  // ── Função de envio de e-mail (apenas se SMTP configurado) ─────────────────
  const EMAIL_INTERVAL = 5 * 60 * 1000; // 5 minutos
  let lastEmailTime = 0;

  const sendAlertEmail = (subject, body) => {
    if (!mailTransport) return;
    if (!process.env.ALERT_EMAIL_TO) return;

    const now = Date.now();
    if (now - lastEmailTime < EMAIL_INTERVAL) return;
    lastEmailTime = now;

    const text = typeof body === 'object' ? JSON.stringify(body, null, 2) : String(body);

    mailTransport
      .sendMail({
        from: process.env.ALERT_EMAIL_FROM || process.env.SMTP_USER,
        to: process.env.ALERT_EMAIL_TO,
        subject: `[BG Representações API] ${subject}`,
        text,
      })
      .then(() => {
        console.info(`[logger] E-mail de alerta enviado: "${subject}"`);
      })
      .catch((err) => {
        console.error('[logger] Falha ao enviar e-mail de alerta:', err.message);
        lastEmailTime = 0;
      });
  };

  // ── Sobrescrita de métodos de erro para enviar alertas ─────────────────────
  const originalError = logger.error.bind(logger);
  const originalFatal = logger.fatal.bind(logger);

  logger.error = function (obj, msg, ...args) {
    const subject = obj?.type ?? 'Erro na API';
    const body = (obj && typeof obj === 'object')
      ? { ...obj, msg, timestamp: new Date().toISOString() }
      : { msg: obj, timestamp: new Date().toISOString() };
    sendAlertEmail(subject, body);
    return originalError(obj, msg, ...args);
  };

  logger.fatal = function (obj, msg, ...args) {
    const subject = 'FATAL — Servidor em risco';
    const body = (obj && typeof obj === 'object')
      ? { ...obj, msg, timestamp: new Date().toISOString() }
      : { msg: obj, timestamp: new Date().toISOString() };
    sendAlertEmail(subject, body);
    return originalFatal(obj, msg, ...args);
  };

  module.exports = logger;
}