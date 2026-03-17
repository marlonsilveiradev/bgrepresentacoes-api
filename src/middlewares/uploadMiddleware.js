const multer = require('multer');
const path = require('path');
const config = require('../config/config');
const logger = require('../config/logger'); // ← corrigido

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
  upload.any()(req, res, (err) => {
    if (err) {
      logger.error({ err }, 'Erro no upload de arquivo.');
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({ error: 'Máximo de 5 arquivos por requisição.' });
      }
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'Arquivo muito grande. Tamanho máximo: 3MB.' });
      }
      return next(err);
    }

    // Sanitiza nomes apenas se vieram arquivos — não bloqueia requisições sem arquivo
    if (req.files?.length > 0) {
      req.files.forEach(file => {
        file.originalname = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
      });
    }

    next();
  });
};

module.exports = { onboardingUpload };