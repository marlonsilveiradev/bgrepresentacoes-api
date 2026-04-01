const multer = require('multer');
const path = require('path');
const config = require('../../../infrastructure/config/config');
const logger = require('../../../infrastructure/config/logger'); // ← corrigido

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (!allowedTypes.includes(file.mimetype) || !allowedExtensions.includes(ext)) {
    return cb(new Error('Tipo de arquivo não permitido.'), false);
  }
  cb(null, true);
};

const upload = multer({
  storage,
  limits: {
    fileSize: config.upload.maxFileSize || 3 * 1024 * 1024,
    files: 5,
  },
  fileFilter,
});

const onboardingUpload = (req, res, next) => {
  // Definimos exatamente quais campos o Multer deve esperar
  const uploadFields = upload.fields([
    { name: 'contrato', maxCount: 1 },
    { name: 'documentos', maxCount: 3 }
  ]);

  uploadFields(req, res, (err) => {
    if (err) {
      logger.error({ err }, 'Erro no upload de arquivo.');
      if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({ error: `Campo de arquivo inesperado: ${err.field}` });
      }
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'Arquivo muito grande. Tamanho máximo: 3MB.' });
      }
      return next(err);
    }

    // Com .fields(), o Multer coloca os arquivos em req.files como um OBJETO de arrays
    // Ex: req.files.contrato[0]
    if (req.files) {
      Object.values(req.files).flat().forEach(file => {
        file.originalname = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
      });
    }

    next();
  });
};

const clientUpdateUpload = (req, res, next) => {
  // Aqui validamos os campos específicos que o seu Update do backend espera
  const uploadFields = upload.fields([
    { name: 'contrato', maxCount: 1 },
    { name: 'proof_of_address', maxCount: 1 },
    { name: 'bank_account_proof', maxCount: 1 },
    { name: 'card_machine_proof', maxCount: 1 }
  ]);

  uploadFields(req, res, (err) => {
    if (err) {
      logger.error({ err }, 'Erro no upload de arquivo durante update.');
      if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({ 
          error: `Campo de arquivo inválido: ${err.field}. Use as chaves: contrato, proof_of_address, bank_account_proof ou card_machine_proof.` 
        });
      }
      return next(err);
    }

    if (req.files) {
      Object.values(req.files).flat().forEach(file => {
        file.originalname = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
      });
    }
    next();
  });
};

module.exports = { onboardingUpload, clientUpdateUpload };