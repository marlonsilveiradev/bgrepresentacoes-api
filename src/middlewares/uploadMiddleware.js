const multer = require('multer');
const config = require('../config/config');

const storage = multer.memoryStorage();

const upload = multer({ 
  storage,
  limits: {
    fileSize: config.upload.maxFileSize
  }
});

// Mudamos de .fields() para .any() para evitar o erro de Unexpected Field
const onboardingUpload = upload.any();

module.exports = { onboardingUpload };