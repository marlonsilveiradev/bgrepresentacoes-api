/**
 * MIDDLEWARE DE UPLOAD (MULTER)
 */

const multer = require('multer');
const path = require('path');

/**
 * Configuração de armazenamento
 */
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + file.originalname;
        cb(null, uniqueSuffix);
    }
});

/**
 * Filtro de arquivos
 */
const fileFilter = (req, file, cb) => {
    const allowedMimes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'application/pdf'
    ];

    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Tipo de arquivo inválido. Apenas JPG, PNG e PDF são permitidos.'), false);
    }
};

/**
 * Configuração do multer
 */
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    }
});

/**
 * Middleware para receber os 3 arquivos
 */
const uploadFields = upload.fields([
    { name: 'document', maxCount: 1 },
    { name: 'invoice', maxCount: 1 },
    { name: 'energy_bill', maxCount: 1 }
]);

/**
 * Tratamento de erros do multer
 */
const handleUploadError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                error: 'Arquivo muito grande. Tamanho máximo: 5MB'
            });
        }

        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({
                success: false,
                error: 'Campo de arquivo inesperado'
            });
        }

        return res.status(400).json({
            success: false,
            error: `Erro no upload: ${err.message}`
        });
    }

    if (err) {
        return res.status(400).json({
            success: false,
            error: err.message
        });
    }

    next();
};

/**
 * Valida se os 3 arquivos foram enviados
 */
const validateRequiredFiles = (req, res, next) => {
    if (!req.files) {
        return res.status(400).json({
            success: false,
            error: 'Nenhum arquivo foi enviado'
        });
    }

    const requiredFields = ['document', 'invoice', 'energy_bill'];
    const missingFields = requiredFields.filter(field => !req.files[field]);

    if (missingFields.length > 0) {
        return res.status(400).json({
            success: false,
            error: `Arquivos obrigatórios faltando: ${missingFields.join(', ')}`
        });
    }

    next();
};

module.exports = {
    uploadFields,
    handleUploadError,
    validateRequiredFiles
};