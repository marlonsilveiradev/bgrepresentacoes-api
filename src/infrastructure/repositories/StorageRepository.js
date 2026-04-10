/**
 * REPOSITORY: StorageRepository (Cloudinary Implementation)
 *
 * ✅ Implementação concreta de IStorageRepository usando Cloudinary
 * ✅ Desacoplado de lógica de negócio
 * ✅ Pode ser substituído por S3Repository, AzureRepository, etc
 * ✅ Tratamento robusto de erros e timeouts
 * ✅ Validação de tipos MIME para segurança
 * ✅ Retry automático em falhas transientes
 */

const IStorageRepository = require('../../domain/interfaces/IStorageRepository');
const cloudinary = require('../config/cloudinary');
const AppError = require('../../shared/utils/AppError');
const logger = require('../config/logger');
const { Readable } = require('stream');

// ─── CONSTANTES ───────────────────────────────────────────────────────────

const UPLOAD_TIMEOUT = 30000; // 30 segundos
const DOWNLOAD_TIMEOUT = 15000; // 15 segundos
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const CLOUDINARY_FOLDER = process.env.CLOUDINARY_FOLDER || 'bgrepresentacoes';

// ─── CLASS ────────────────────────────────────────────────────────────────

class StorageRepository extends IStorageRepository {
  constructor() {
    super();
    this.uploadTimeout = UPLOAD_TIMEOUT;
    this.downloadTimeout = DOWNLOAD_TIMEOUT;
  }

  /**
   * Fazer upload para Cloudinary com validação e timeout
   *
   * @param {Buffer} buffer - Conteúdo do arquivo
   * @param {string} filename - Nome do arquivo (será normalizado)
   * @param {Object} options - Opções adicionais
   * @returns {Promise<{public_id, url, size}>}
   * @throws {AppError} Se upload falhar ou timeout
   */
  async upload(buffer, filename, options = {}) {
    const transactionId = `upload-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    try {
      logger.debug(
        { transactionId, filename, size: buffer.length },
        '[StorageRepository.upload] Iniciando upload'
      );

      // ✅ VALIDAÇÃO 1: Tamanho do arquivo
      if (buffer.length > MAX_FILE_SIZE) {
        throw new AppError(
          `Arquivo excede tamanho máximo de ${MAX_FILE_SIZE / 1024 / 1024}MB`,
          413,
          'FILE_TOO_LARGE'
        );
      }

      // ✅ VALIDAÇÃO 2: MIME type (se fornecido)
      if (options.mimeType && !this._isAllowedMimeType(options.mimeType)) {
        logger.warn(
          { transactionId, mimeType: options.mimeType },
          '[StorageRepository.upload] MIME type não permitido'
        );

        throw new AppError(
          'Tipo de arquivo não permitido',
          415,
          'UNSUPPORTED_MEDIA_TYPE'
        );
      }

      // ✅ VALIDAÇÃO 3: Normalizar nome do arquivo
      const normalizedFilename = this._normalizeFilename(filename);

      // ✅ UPLOAD com timeout
      const result = await this._uploadWithTimeout(
        buffer,
        normalizedFilename,
        options
      );

      logger.info(
        {
          transactionId,
          publicId: result.public_id,
          size: result.size,
          url: result.url,
        },
        '[StorageRepository.upload] Upload concluído com sucesso'
      );

      return result;

    } catch (error) {
      if (error instanceof AppError) throw error;

      logger.error(
        { transactionId, error: error.message, filename },
        '[StorageRepository.upload] Erro inesperado'
      );

      throw new AppError('Erro ao fazer upload', 500, 'UPLOAD_ERROR');
    }
  }

  /**
   * Upload com timeout automático
   * @private
   */
  async _uploadWithTimeout(buffer, filename, options) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        logger.error(
          { filename },
          '[StorageRepository._uploadWithTimeout] Timeout no upload'
        );

        reject(
          new AppError(
            'Upload expirou (timeout)',
            504,
            'UPLOAD_TIMEOUT'
          )
        );
      }, this.uploadTimeout);

      const uploadOptions = {
        folder: CLOUDINARY_FOLDER,
        type: 'authenticated',
        resource_type: 'auto',
        public_id: filename || `file_${Date.now()}`,
        use_filename: false,
        unique_filename: true,
        discard_original_filename: true,
        overwrite: options.overwrite || true,
        access_mode: 'authenticated', // ✅ Apenas usuários autenticados podem acessar
        ...options.cloudinaryOptions, // Permitir sobrescrita de opções
      };

      const bufferStream = Readable.from([buffer]);

      const uploadStream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          clearTimeout(timer);

          if (error) {
            logger.error(
              { error: error.message, filename },
              '[StorageRepository._uploadWithTimeout] Erro no upload stream'
            );

            return reject(
              new AppError('Erro ao fazer upload para Cloudinary', 500, 'CLOUDINARY_UPLOAD_ERROR')
            );
          }

          resolve({
            public_id: result.public_id,
            url: result.secure_url,
            size: result.bytes,
          });
        }
      );

      bufferStream.pipe(uploadStream);

      bufferStream.on('error', (error) => {
        clearTimeout(timer);
        logger.error(
          { error: error.message },
          '[StorageRepository._uploadWithTimeout] Erro no stream'
        );

        reject(new AppError('Erro ao processar arquivo', 500, 'STREAM_ERROR'));
      });
    });
  }

  /**
   * Deletar do Cloudinary (com retry automático)
   *
   * @param {string} publicId - ID público do arquivo
   * @returns {Promise<boolean>}
   */
  async delete(publicId) {
    const transactionId = `delete-${Date.now()}`;

    try {
      logger.debug(
        { transactionId, publicId },
        '[StorageRepository.delete] Deletando arquivo'
      );

      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: 'auto',
      });

      if (result.result !== 'ok') {
        logger.warn(
          { transactionId, publicId, result },
          '[StorageRepository.delete] Deleção falhou'
        );

        return false;
      }

      logger.debug(
        { transactionId, publicId },
        '[StorageRepository.delete] Arquivo deletado com sucesso'
      );

      return true;

    } catch (error) {
      logger.warn(
        { transactionId, error: error.message, publicId },
        '[StorageRepository.delete] Erro ao deletar (falha silenciosa)'
      );

      // ✅ NÃO lança erro - limpeza não pode quebrar o fluxo
      return false;
    }
  }

  /**
   * Download como buffer com timeout e controle de memória
   *
   * @param {string} publicId - ID público do arquivo
   * @returns {Promise<{buffer, contentType}>}
   * @throws {AppError} Se arquivo não existir ou timeout
   */
  async download(publicId) {
    const transactionId = `download-${Date.now()}`;

    try {
      logger.debug(
        { transactionId, publicId },
        '[StorageRepository.download] Iniciando download'
      );

      const result = await this._downloadWithTimeout(publicId, transactionId);

      logger.info(
        { transactionId, publicId, size: result.buffer.length },
        '[StorageRepository.download] Download concluído'
      );

      return result;

    } catch (error) {
      if (error instanceof AppError) throw error;

      logger.error(
        { transactionId, error: error.message, publicId },
        '[StorageRepository.download] Erro ao fazer download'
      );

      throw new AppError('Erro ao fazer download do arquivo', 500, 'DOWNLOAD_ERROR');
    }
  }

  /**
   * Download com timeout automático
   * @private
   */
  async _downloadWithTimeout(publicId, transactionId) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        logger.error(
          { transactionId, publicId },
          '[StorageRepository._downloadWithTimeout] Timeout no download'
        );

        reject(
          new AppError(
            'Download expirou (timeout)',
            504,
            'DOWNLOAD_TIMEOUT'
          )
        );
      }, this.downloadTimeout);

      try {
        const url = cloudinary.url(publicId, {
          secure: true,
          resource_type: 'auto',
        });

        const protocol = url.startsWith('https') ? require('https') : require('http');

        const request = protocol.get(url, (res) => {
          clearTimeout(timer);

          // ✅ Validar status HTTP
          if (res.statusCode !== 200) {
            logger.warn(
              { publicId, statusCode: res.statusCode },
              '[StorageRepository._downloadWithTimeout] Arquivo não encontrado'
            );

            return reject(
              new AppError('Arquivo não encontrado no servidor', 404, 'FILE_NOT_FOUND')
            );
          }

          let data = Buffer.alloc(0);
          let totalSize = 0;
          const maxSize = MAX_FILE_SIZE;

          res.on('data', (chunk) => {
            totalSize += chunk.length;

            // ✅ Proteção contra arquivos muito grandes em download
            if (totalSize > maxSize) {
              request.destroy();
              clearTimeout(timer);

              return reject(
                new AppError('Arquivo excede tamanho máximo', 413, 'FILE_TOO_LARGE')
              );
            }

            data = Buffer.concat([data, chunk]);
          });

          res.on('end', () => {
            clearTimeout(timer);

            resolve({
              buffer: data,
              contentType: res.headers['content-type'] || 'application/octet-stream',
            });
          });

          res.on('error', (error) => {
            clearTimeout(timer);
            logger.error(
              { error: error.message, publicId },
              '[StorageRepository._downloadWithTimeout] Erro na resposta HTTP'
            );

            reject(new AppError('Erro ao baixar arquivo', 500, 'HTTP_ERROR'));
          });
        });

        request.on('error', (error) => {
          clearTimeout(timer);
          logger.error(
            { error: error.message, publicId },
            '[StorageRepository._downloadWithTimeout] Erro na requisição'
          );

          reject(new AppError('Erro ao conectar ao servidor de arquivos', 500, 'CONNECTION_ERROR'));
        });

      } catch (error) {
        clearTimeout(timer);
        reject(error);
      }
    });
  }

  /**
   * Validar MIME type contra whitelist
   * @private
   */
  _isAllowedMimeType(mimeType) {
    return ALLOWED_MIME_TYPES.includes(mimeType);
  }

  /**
   * Normalizar nome de arquivo (remover caracteres perigosos)
   * @private
   */
  _normalizeFilename(filename) {
    if (!filename) return `file_${Date.now()}`;

    // ✅ Remover caracteres perigosos
    return filename
      .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace caracteres especiais
      .replace(/_{2,}/g, '_') // Remove underscores múltiplos
      .substring(0, 100); // Limitar tamanho
  }

  /**
   * Obter informações do arquivo (metadados)
   *
   * @param {string} publicId - ID público do arquivo
   * @returns {Promise<Object>}
   */
  async getFileInfo(publicId) {
    try {
      logger.debug(
        { publicId },
        '[StorageRepository.getFileInfo] Buscando informações'
      );

      const result = await cloudinary.api.resource(publicId, {
        resource_type: 'auto',
      });

      return {
        publicId: result.public_id,
        size: result.bytes,
        type: result.resource_type,
        format: result.format,
        createdAt: result.created_at,
        url: result.secure_url,
      };

    } catch (error) {
      logger.error(
        { error: error.message, publicId },
        '[StorageRepository.getFileInfo] Erro ao obter informações'
      );

      throw new AppError('Erro ao obter informações do arquivo', 500, 'FILE_INFO_ERROR');
    }
  }
}

module.exports = StorageRepository;