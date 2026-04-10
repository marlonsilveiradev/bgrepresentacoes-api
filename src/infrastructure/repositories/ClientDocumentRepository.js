const { ClientDocument } = require('./models');
const AppError = require('../../shared/utils/AppError');

class ClientDocumentRepository {
  constructor() {
    this.model = ClientDocument;
  }

  async create(data, options = {}) {
    return await this.model.create(data, {
      transaction: options.transaction || null,
    });
  }

  async update(id, data, options = {}) {
    const document = await this.model.findByPk(id, {
      transaction: options.transaction || null,
    });

    if (!document) {
      throw new AppError('Documento não encontrado', 404, 'DOCUMENT_NOT_FOUND');
    }

    return await document.update(data, {
      transaction: options.transaction || null,
    });
  }

  // ✅ ADICIONAR ESTE MÉTODO AQUI
  async findByType(clientId, documentType, options = {}) {
    return await this.model.findOne({
      where: {
        client_id: clientId,
        document_type: documentType,
      },
      transaction: options.transaction || null,
    });
  }

  async findById(id, options = {}) {
    return await this.model.findByPk(id, {
      transaction: options.transaction || null,
    });
  }

  async findByClientId(clientId, options = {}) {
    return await this.model.findAll({
      where: { client_id: clientId },
      transaction: options.transaction || null,
    });
  }

  async delete(id, options = {}) {
    const document = await this.model.findByPk(id, {
      transaction: options.transaction || null,
    });

    if (!document) {
      throw new AppError('Documento não encontrado', 404, 'DOCUMENT_NOT_FOUND');
    }

    return await document.destroy({
      transaction: options.transaction || null,
    });
  }

  async findByIdWithClient(documentId) {
    try {
      const doc = await this.model.findByPk(documentId, {
        include: [
          {
            model: this.model.sequelize.models.Client,
            as: 'client',
            attributes: ['id', 'created_by', 'partner_id', 'corporate_name'],
          },
        ],
      });

      if (!doc) {
        logger.debug({ documentId }, '[ClientDocumentRepository] Documento não encontrado');
        return null;
      }

      return doc;

    } catch (error) {
      logger.error(
        { error: error.message, documentId },
        '[ClientDocumentRepository.findByIdWithClient] Erro'
      );

      throw new AppError('Erro ao buscar documento', 500, 'DOCUMENT_FETCH_ERROR');
    }
  }
}

module.exports = ClientDocumentRepository;