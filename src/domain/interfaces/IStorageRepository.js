/**
 * INTERFACE: IStorageRepository
 * 
 * Responsabilidade: Contrato para operações de armazenamento (Cloudinary, S3, etc)
 * 
 * ✅ Permite trocar provider de storage sem alterar lógica de domínio
 * ✅ Implementado em JavaScript puro (sem TypeScript)
 * 
 * @abstract
 */

class IStorageRepository {
  /**
   * Fazer upload de arquivo
   * 
   * @param {Buffer} buffer - Conteúdo do arquivo em bytes
   * @param {string} filename - Nome customizado para o arquivo
   * @returns {Promise<{public_id: string, url: string, size: number}>}
   * @throws {AppError}
   * 
   * @abstract
   */
  async upload(buffer, filename) {
    throw new Error(
      'upload() deve ser implementado na classe filha'
    );
  }

  /**
   * Deletar arquivo
   * 
   * @param {string} publicId - ID público do arquivo no storage
   * @returns {Promise<void>}
   * @throws {AppError}
   * 
   * @abstract
   */
  async delete(publicId) {
    throw new Error(
      'delete() deve ser implementado na classe filha'
    );
  }

  /**
   * Download de arquivo como buffer
   * 
   * @param {string} publicId - ID público do arquivo no storage
   * @returns {Promise<{buffer: Buffer, contentType: string}>}
   * @throws {AppError}
   * 
   * @abstract
   */
  async download(publicId) {
    throw new Error(
      'download() deve ser implementado na classe filha'
    );
  }
}

module.exports = IStorageRepository;