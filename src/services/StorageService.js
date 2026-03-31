const https    = require('https');
const http     = require('http');
const cloudinary = require('../config/cloudinary');
const logger   = require('../config/logger');

/**
 * Faz upload de um buffer para o Cloudinary via stream.
 * @param {Buffer} buffer
 * @param {string} customFilename - public_id customizado (opcional)
 * @returns {Promise<object>} Resultado completo do Cloudinary
 */
const uploadToCloudinary = (buffer, customFilename = '') => {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder:                    'bgrepresentacoes',
      type:                      'authenticated',   // sem acesso público direto
      resource_type:             'auto',
      public_id:                 customFilename || `file_${Date.now()}`,
      use_filename:              false,
      unique_filename:           true,
      discard_original_filename: true,
      overwrite:                 true,
    };

    const uploadStream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
      if (error) {
        logger.error({ err: error }, 'Erro no upload para o Cloudinary');
        return reject(new Error(`Falha no upload: ${error.message}`));
      }
      resolve(result);
    });

    uploadStream.end(buffer);
  });
};

/**
 * Remove um arquivo do Cloudinary.
 * @param {string} publicId
 */
const deleteFromCloudinary = async (publicId) => {
  try {
    // 1. Tentamos deletar como 'raw' (comum para PDFs e documentos)
    let result = await cloudinary.uploader.destroy(publicId, {
      type: 'authenticated',
      resource_type: 'raw', // Mudamos de 'auto' para 'raw'
      invalidate: true,
    });

    // 2. Se o resultado não for 'ok' (ex: o arquivo era um PNG/JPG e está na categoria 'image')
    if (result.result !== 'ok') {
      result = await cloudinary.uploader.destroy(publicId, {
        type: 'authenticated',
        resource_type: 'image',
        invalidate: true,
      });
    }

    return result;
  } catch (error) {
    // Mantive seu logger original
    logger.error({ err: error, publicId }, 'Erro ao remover arquivo do Cloudinary');
  }
};

/**
 * [USO INTERNO APENAS]
 * Gera uma URL assinada de curta duração para uso exclusivo do backend.
 * NUNCA retornar essa URL para o frontend — ela expõe chave e assinatura.
 *
 * @param {string} publicId
 * @param {number} expiresInSeconds - padrão 60s (suficiente para o proxy baixar)
 * @returns {string}
 */
const _generateInternalSignedUrl = (publicId, expiresInSeconds = 60) => {
  return cloudinary.utils.private_download_url(publicId, '', {
    resource_type: 'image',
    type:          'authenticated',
    expires_at:    Math.floor(Date.now() / 1000) + expiresInSeconds,
    attachment:    false,
  });
};

/**
 * Faz o download de um arquivo do Cloudinary como Buffer.
 * Usa o módulo nativo `https` do Node — sem dependências externas.
 * Segue redirecionamentos (até 3 saltos).
 *
 * @param {string} publicId  - public_id do Cloudinary
 * @param {number} redirects - contador interno de redirecionamentos (não passar manualmente)
 * @returns {Promise<{ buffer: Buffer, contentType: string }>}
 */
const downloadFileAsBuffer = (publicId, redirects = 0) => {
  return new Promise((resolve, reject) => {
    if (redirects > 3) {
      return reject(new Error('Muitos redirecionamentos ao buscar arquivo no Cloudinary.'));
    }

    // URL assinada de curta duração — nunca sai deste servidor
    const signedUrl = _generateInternalSignedUrl(publicId);

    const protocol = signedUrl.startsWith('https') ? https : http;

    protocol.get(signedUrl, (res) => {
      // Segue redirecionamentos (301/302/307/308)
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(
          _followRedirect(res.headers.location, redirects + 1)
        );
      }

      if (res.statusCode !== 200) {
        return reject(
          new Error(`Cloudinary retornou status ${res.statusCode} para public_id: ${publicId}`)
        );
      }

      const contentType = res.headers['content-type'] || 'application/octet-stream';
      const chunks = [];

      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end',  () => resolve({ buffer: Buffer.concat(chunks), contentType }));
      res.on('error', reject);
    }).on('error', reject);
  });
};

/**
 * Segue um redirecionamento usando a URL absoluta retornada pelo Cloudinary.
 * @private
 */
const _followRedirect = (location, redirects) => {
  return new Promise((resolve, reject) => {
    const protocol = location.startsWith('https') ? https : http;

    protocol.get(location, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(_followRedirect(res.headers.location, redirects + 1));
      }

      const contentType = res.headers['content-type'] || 'application/octet-stream';
      const chunks = [];

      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end',  () => resolve({ buffer: Buffer.concat(chunks), contentType }));
      res.on('error', reject);
    }).on('error', reject);
  });
};

module.exports = {
  uploadToCloudinary,
  deleteFromCloudinary,
  downloadFileAsBuffer,
  // generateSignedUrl removido intencionalmente:
  // URLs do Cloudinary não devem ser expostas ao frontend.
  // Use o endpoint GET /api/v1/documents/:id/download como proxy.
};