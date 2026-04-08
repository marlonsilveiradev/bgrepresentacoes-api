/**
 * REPOSITORY: StorageRepository (Cloudinary Implementation)
 * 
 * Implementação concreta de IStorageRepository usando Cloudinary
 * 
 * ✅ Segue contrato definido em IStorageRepository
 * ✅ Desacoplado de lógica de negócio
 * ✅ Pode ser substituído por S3Repository, AzureRepository, etc
 */

const IStorageRepository = require('../../domain/interfaces/IStorageRepository');
const cloudinary = require('../config/cloudinary');
const AppError = require('../../shared/utils/AppError');
const logger = require('../config/logger');

class StorageRepository extends IStorageRepository {
  /**
   * Fazer upload para Cloudinary
   */
  async upload(buffer, filename) {
    try {
      return await new Promise((resolve, reject) => {
        const uploadOptions = {
          folder: 'bgrepresentacoes',
          type: 'authenticated',
          resource_type: 'auto',
          public_id: filename || `file_${Date.now()}`,
          use_filename: false,
          unique_filename: true,
          discard_original_filename: true,
          overwrite: true,
        };

        const uploadStream = cloudinary.uploader.upload_stream(
          uploadOptions,
          (error, result) => {
            if (error) {
              logger.error(
                { error: error.message, filename },
                '[StorageRepository.upload] Erro no upload'
              );
              return reject(
                new AppError('Erro ao fazer upload', 500, 'UPLOAD_ERROR')
              );
            }
            resolve({
              public_id: result.public_id,
              url: result.secure_url,
              size: result.bytes,
            });
          }
        );

        uploadStream.end(buffer);
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Erro ao fazer upload', 500, 'UPLOAD_ERROR');
    }
  }

  /**
   * Deletar do Cloudinary
   */
  async delete(publicId) {
    try {
      await cloudinary.uploader.destroy(publicId);
      logger.debug(
        { publicId },
        '[StorageRepository.delete] Arquivo deletado'
      );
    } catch (error) {
      logger.warn(
        { error: error.message, publicId },
        '[StorageRepository.delete] Erro ao deletar (ignora)'
      );
      // Não lança erro - a limpeza não pode quebrar o fluxo
    }
  }

  /**
   * Download como buffer
   */
  async download(publicId) {
    try {
      return await new Promise((resolve, reject) => {
        const url = cloudinary.url(publicId, { secure: true });
        const protocol = url.startsWith('https') ? require('https') : require('http');

        protocol.get(url, (res) => {
          let data = Buffer.alloc(0);

          res.on('data', (chunk) => {
            data = Buffer.concat([data, chunk]);
          });

          res.on('end', () => {
            resolve({
              buffer: data,
              contentType: res.headers['content-type'] || 'application/octet-stream',
            });
          });

          res.on('error', reject);
        });
      });
    } catch (error) {
      logger.error(
        { error: error.message, publicId },
        '[StorageRepository.download] Erro ao baixar'
      );
      throw new AppError('Erro ao baixar arquivo', 500, 'DOWNLOAD_ERROR');
    }
  }
}

module.exports = StorageRepository;