/**
 * CONTROLLER: Document Controller
 *
 * ✅ Gerencia rotas de download de documentos do cliente
 * ✅ Refatorado para Clean Architecture (usa DownloadClientDocumentUseCase)
 * ✅ Removido acoplamento com DocumentService
 * ✅ Validação de acesso centralizada na UseCase
 * ✅ Headers de segurança otimizados
 */

const DownloadClientDocumentUseCase = require('../../../application/use-cases/client-document/DownloadClientDocumentUseCase');
const logger = require('../../../infrastructure/config/logger');

class DocumentController {
  /**
   * Download de documento do cliente com proxy seguro
   *
   * **Fluxo:**
   * 1. Middleware valida autenticação (authMiddleware)
   * 2. Middleware valida parametro ID (validate)
   * 3. Controller instancia UseCase
   * 4. UseCase valida permissão + busca documento + faz download
   * 5. Controller retorna arquivo com headers seguro
   *
   * **Headers de Segurança:**
   * - Content-Type: tipo MIME do arquivo
   * - Content-Length: tamanho do arquivo
   * - Content-Disposition: inline (abre no navegador) ou attachment (faz download)
   * - Cache-Control: private, no-store (não cacheia em CDN/proxy)
   *
   * @param {Object} req - Express request
   * @param {string} req.params.id - Document ID (UUID)
   * @param {Object} req.user - Usuário autenticado (vem do authMiddleware)
   * @param {Object} res - Express response
   * @param {Function} next - Express next (error handler)
   *
   * @returns {void} Envia arquivo binário como resposta HTTP
   *
   * @throws {AppError} Se documento não existir ou acesso negado
   */
  static async downloadDocument(req, res, next) {
    const transactionId = `ctrl-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    try {
      const { id } = req.params;

      logger.debug(
        {
          transactionId,
          documentId: id,
          userId: req.user.id,
          userRole: req.user.role,
        },
        '[DocumentController.downloadDocument] Iniciando requisição de download'
      );

      // ✅ PASSO 1: Instanciar UseCase com dependências
      const useCase = new DownloadClientDocumentUseCase(
        req.app.locals.clientDocumentRepository,
        req.app.locals.storageRepository
      );

      // ✅ PASSO 2: Executar UseCase (valida permissão + faz download)
      const { buffer, contentType, filename, size, documentType } = await useCase.execute(
        id,
        req.user
      );

      // ✅ PASSO 3: Preparar headers de resposta
      const safeFilename = this._encodeFilename(filename);

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Length', size);
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${safeFilename}"`
      );

      // ✅ Headers de segurança
      res.setHeader('Cache-Control', 'private, no-store, no-cache, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');

      // ✅ Prevenir MIME type sniffing
      res.setHeader('X-Content-Type-Options', 'nosniff');

      // ✅ PASSO 4: Enviar arquivo
      logger.info(
        {
          transactionId,
          documentId: id,
          userId: req.user.id,
          filename,
          size,
          contentType,
          documentType,
        },
        '[DocumentController.downloadDocument] Download enviado com sucesso'
      );

      res.send(buffer);

    } catch (error) {
      logger.error(
        {
          transactionId,
          documentId: req.params.id,
          userId: req.user?.id,
          error: error.message,
          errorCode: error.code,
        },
        '[DocumentController.downloadDocument] Erro no download'
      );

      // ✅ Delegar ao middleware de erro
      next(error);
    }
  }

  /**
   * Codificar nome de arquivo para headers HTTP
   * RFC 5987: filename*=UTF-8''filename
   *
   * @private
   */
  static _encodeFilename(filename) {
    try {
      // ✅ Remover caracteres perigosos
      const sanitized = filename
        .replace(/[^\w\s.-]/g, '_') // Remove caracteres especiais
        .replace(/\s+/g, '_') // Replace espaços
        .substring(0, 100); // Limitar tamanho

      // ✅ Codificar para UTF-8 (RFC 5987)
      return encodeURIComponent(sanitized);

    } catch (error) {
      logger.warn(
        { filename, error: error.message },
        '[DocumentController._encodeFilename] Erro ao codificar filename'
      );

      // Fallback seguro
      return 'documento.pdf';
    }
  }
}

module.exports = DocumentController;