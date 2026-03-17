const pino = require('pino');
const nodemailer = require('nodemailer');
const isProd = process.env.NODE_ENV === 'production';

// 1. Configuração do transportador de e-mail (usando seus dados do .env)
const mailTransport = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: false, // Porta 587 usa STARTTLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// 2. Configuração do Logger
const logger = isProd
  ? pino({ level: process.env.LOG_LEVEL || 'info' })
  : pino({
      level: process.env.LOG_LEVEL || 'info',
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname'
        }
      }
    });

// 3. Listener para disparar e-mail em caso de erro
// Sempre que o logger emitir uma mensagem de nível 50 (error) ou 60 (fatal)
logger.on('level-change', (lvl, val) => {
  /* Opcional: monitorar mudanças de nível */
});

// Sobrescrevemos o método de erro apenas para adicionar o disparo do e-mail
const EMAIL_INTERVAL = 5 * 60 * 1000; // 5 minutos entre e-mails
let lastEmailTime = 0;
const originalError = logger.error.bind(logger);
logger.error = function (obj, ...args) {
  const now = Date.now();
  // Dispara o e-mail em background
  if (now - lastEmailTime > EMAIL_INTERVAL) {
   lastEmailTime = now;

   mailTransport.sendMail({
      from: process.env.ALERT_EMAIL_FROM,
      to: process.env.ALERT_EMAIL_TO,
      subject: `Erro API`,
      text: JSON.stringify(obj, null, 2)
   }).catch(err =>
      console.error('Falha ao enviar e-mail de alerta:', err.message)
    );
}

  // Executa o log original no console
  return originalError(obj, ...args);
};

module.exports = logger;