const multer = require('multer');
const path = require('path');
const { fileTypeFromBuffer } = require('file-type');
const config = require('../../../infrastructure/config/config');
const logger = require('../../../infrastructure/config/logger');
const storage = multer.memoryStorage();

const fileFilter = async (req, file, cb) => {
  try {
    // 1. Verifica extensão e MIME rápido (primeiro filtro)
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      return cb(new Error('Extensão de arquivo não permitida.'), false);
    }

    // 2. Verifica o conteúdo real (magic bytes)
    const type = await fileTypeFromBuffer(file.buffer);
    if (!type) {
      return cb(new Error('Não foi possível identificar o tipo do arquivo.'), false);
    }

    // 3. MIME types permitidos (após identificação real)
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedMimes.includes(type.mime)) {
      return cb(new Error(`Tipo de arquivo real não permitido (${type.mime}).`), false);
    }

    // 4. Opcional: verificar consistência entre extensão e tipo real
    const extToMime = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
      '.pdf': 'application/pdf'
    };
    if (extToMime[ext] !== type.mime) {
      return cb(new Error(`Arquivo com extensão ${ext} mas tipo real ${type.mime}. Rejeitado.`), false);
    }

    // Tudo OK
    cb(null, true);
  } catch (error) {
    // Se ocorrer qualquer erro na validação, rejeita o arquivo
    logger.warn({
      type: 'UPLOAD_REJECTED',
      filename: file.originalname,
      ext,
      realMime: type.mime,
      ip: req.ip,
      user: req.user?.id || 'anonymous'
    }, 'Arquivo rejeitado por inconsistência de tipo.');
    cb(new Error('Erro ao validar arquivo.'), false);
  }
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