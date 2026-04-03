const multer = require('multer');
const path = require('path');
const AppError = require('../../../shared/utils/AppError');
const fileType = require('file-type');
const logger = require('../../../infrastructure/config/logger');

const storage = multer.memoryStorage();

// ─────────────────────────────────────────────────────────────
// CONFIGURAÇÕES CENTRALIZADAS
// ─────────────────────────────────────────────────────────────
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'];

const EXT_TO_MIME = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.pdf': 'application/pdf'
};

const ALLOWED_MIMES = Object.values(EXT_TO_MIME);

const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3MB
const MAX_TOTAL_FILES = 5;

// ─────────────────────────────────────────────────────────────
// FILTRO RÁPIDO (ANTES DO BUFFER)
// ─────────────────────────────────────────────────────────────
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();

  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return cb(new AppError(`Extensão ${ext} não permitida.`, 400), false);
  }

  cb(null, true);
};

// ─────────────────────────────────────────────────────────────
// INSTÂNCIA BASE DO MULTER
// ─────────────────────────────────────────────────────────────
const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: MAX_TOTAL_FILES,
  },
  fileFilter,
});

// ─────────────────────────────────────────────────────────────
// VALIDAÇÃO PROFUNDA (PÓS-UPLOAD)
// ─────────────────────────────────────────────────────────────
const validateFiles = async (files, req) => {
  const allFiles = Object.values(files).flat();

  for (const file of allFiles) {
    const ext = path.extname(file.originalname).toLowerCase();

    // 1. Detecta tipo real
    const type = await fileType.fromBuffer(file.buffer);

    if (!type) {
      throw new AppError(
        `Não foi possível identificar o tipo do arquivo ${file.originalname}.`,
        400
      );
    }

    // 2. Verifica MIME permitido
    if (!ALLOWED_MIMES.includes(type.mime)) {
      throw new AppError(
        `Tipo de arquivo não permitido (${type.mime}) para ${file.originalname}.`,
        400
      );
    }

    // 3. Verifica consistência EXTENSÃO vs MIME
    if (EXT_TO_MIME[ext] !== type.mime) {
      throw new AppError(
        `Arquivo ${file.originalname} inconsistente (extensão ${ext} vs tipo ${type.mime}).`,
        400
      );
    }

    // 4. Sanitiza nome
    file.originalname = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
  }
};

// ─────────────────────────────────────────────────────────────
// FACTORY PARA MIDDLEWARE DE UPLOAD
// ─────────────────────────────────────────────────────────────
const createUploadMiddleware = (fieldsConfig) => {
  return (req, res, next) => {
    const uploadFields = upload.fields(fieldsConfig);

    uploadFields(req, res, async (err) => {
      if (err) {
        logger.warn({ err }, 'Erro no upload de arquivos');

        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(new AppError('Arquivo excede o limite de 3MB.', 400));
        }

        if (err.code === 'LIMIT_FILE_COUNT') {
          return next(new AppError('Quantidade total de arquivos excedida.', 400));
        }

        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return next(new AppError(`Campo de arquivo inválido: ${err.field}`, 400));
        }

        return next(err);
      }

      try {
        if (req.files) {
          await validateFiles(req.files, req);
        }

        next();
      } catch (error) {
        logger.warn({
          error: error.message,
          user: req.user?.id || 'anonymous',
          ip: req.ip
        }, 'Arquivo rejeitado na validação profunda');

        next(error);
      }
    });
  };
};

// ─────────────────────────────────────────────────────────────
// MIDDLEWARES ESPECÍFICOS
// ─────────────────────────────────────────────────────────────
const onboardingUpload = createUploadMiddleware([
  { name: 'contrato', maxCount: 1 },
  { name: 'documentos', maxCount: 3 }
]);

const clientUpdateUpload = createUploadMiddleware([
  { name: 'contrato', maxCount: 1 },
  { name: 'proof_of_address', maxCount: 1 },
  { name: 'bank_account_proof', maxCount: 1 },
  { name: 'card_machine_proof', maxCount: 1 }
]);

// ─────────────────────────────────────────────────────────────
module.exports = {
  onboardingUpload,
  clientUpdateUpload
};