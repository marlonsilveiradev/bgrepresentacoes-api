const { sequelize, Client, ClientDocument, Sale, SaleFlag, ClientBankAccount, Plan, ClientFlag, Flag } = require('../repositories/models');
const StorageService = require('./StorageService');
const logger = require('../../infrastructure/config/logger');
const AppError = require('../../shared/utils/AppError');
const { generateProtocol } = require('../../shared/utils/protocol');

class OnboardingService {
  async onboardClient(requester, rawData, files) {
    const uploadedPublicIds = [];

    // 1. Valida e prepara plano ou bandeiras
    const { plan, selectedFlags } = await this._validatePlanOrFlags(rawData);

    // 2. Cria cliente e conta bancária em transação
    const result = await sequelize.transaction(async (t) => {
      const client = await this._createClient(requester, rawData, t);
      const bankAccount = await this._createBankAccount(client.id, rawData, t);

      const { flags, totalValue } = this._calculateFlagsAndValue(plan, selectedFlags);
      const sale = await this._createSale(client.id, plan, totalValue, requester.id, t);
      await this._associateFlags(sale.id, client.id, flags, t);

      const documents = await this._processDocuments(client.id, files, requester.id, uploadedPublicIds, t);
      return { client, bankAccount, sale, documents, flags };
    });

    // 3. Retorna dados formatados (fora da transação)
    return this._formatResponse(result);
  }

  // ========== Métodos privados ==========

  async _validatePlanOrFlags(rawData) {
    const hasFlagIds = Array.isArray(rawData.flag_ids) && rawData.flag_ids.length > 0;

    if (rawData.plan_id) {
      const plan = await Plan.findByPk(rawData.plan_id, {
        include: [{ model: Flag, as: 'flags', through: { attributes: [] } }],
      });
      if (!plan) throw new AppError('O plano selecionado é inválido ou não está mais ativo.', 422);
      return { plan, selectedFlags: null };
    }

    if (!hasFlagIds) {
      throw new AppError('Informe um plano ou ao menos uma bandeira individual.', 422);
    }

    const selectedFlags = await Flag.findAll({
      where: { id: rawData.flag_ids },
    });
    if (selectedFlags.length !== rawData.flag_ids.length) {
      throw new AppError('Uma ou mais bandeiras não foram encontradas.', 422);
    }
    return { plan: null, selectedFlags };
  }

  async _createClient(requester, rawData, transaction) {
    const client = await Client.create(
      {
        ...rawData,
        protocol: await generateProtocol(),
        created_by: requester.id,
        overall_status: 'pending',
      },
      { transaction }
    );
    return client;
  }

  async _createBankAccount(clientId, rawData, transaction) {
    return await ClientBankAccount.create(
      { ...rawData, client_id: clientId },
      { transaction }
    );
  }

  _calculateFlagsAndValue(plan, selectedFlags) {
    if (plan) {
      // Modo plano
      const flags = plan.flags.map(f => ({
        id: f.id,
        name: f.name,
        price: Number.parseFloat(f.price || 0),
        origin: 'plan',
      }));
      const totalValue = Number.parseFloat(plan.price || 0);
      return { flags, totalValue };
    }

    // Modo individual
    const flags = selectedFlags.map(f => ({
      id: f.id,
      name: f.name,
      price: Number.parseFloat(f.price || 0),
      origin: 'individual',
    }));
    const totalValue = flags.reduce((sum, f) => sum + f.price, 0);
    return { flags, totalValue };
  }

  async _createSale(clientId, plan, totalValue, soldBy, transaction) {
    const sale = await Sale.create(
      {
        client_id: clientId,
        plan_id: plan?.id ?? null,
        total_value: totalValue,
        plan_name: plan?.name ?? 'Bandeiras Individuais',
        plan_price: plan?.price ?? 0,
        sold_by: soldBy,
        status: 'pending',
      },
      { transaction }
    );
    return sale;
  }

  async _associateFlags(saleId, clientId, flags, transaction) {
    if (!flags.length) return;

    // Salva na tabela sale_flags
    await SaleFlag.bulkCreate(
      flags.map(f => ({
        sale_id: saleId,
        flag_id: f.id,
        price: f.price,
        status: 'pending',
      })),
      { transaction }
    );

    // Salva na tabela client_flags
    await ClientFlag.bulkCreate(
      flags.map(f => ({
        client_id: clientId,
        flag_id: f.id,
        status: 'pending',
        origin: f.origin,
        price: f.price,
      })),
      { transaction }
    );
  }

  async _processDocuments(clientId, files, uploadedBy, uploadedPublicIds, transaction) {
    const documentsToSave = [];

    // Contrato
    if (files.contrato?.length) {
      const file = files.contrato[0];
      const upload = await StorageService.uploadToCloudinary(file.buffer, `contrato_${clientId}`);
      uploadedPublicIds.push(upload.public_id);
      documentsToSave.push({
        client_id: clientId,
        cloudinary_public_id: upload.public_id,
        document_type: 'company_document',
        original_name: file.originalname,
        mime_type: file.mimetype,
        file_size: file.size,
        uploaded_by: uploadedBy,
      });
    }

    // Documentos complementares (até 3)
    if (files.documentos?.length) {
      const types = ['proof_of_address', 'bank_account_proof', 'card_machine_proof'];
      for (let i = 0; i < Math.min(files.documentos.length, types.length); i++) {
        const file = files.documentos[i];
        const upload = await StorageService.uploadToCloudinary(
          file.buffer,
          `doc_${types[i]}_${clientId}`
        );
        uploadedPublicIds.push(upload.public_id);
        documentsToSave.push({
          client_id: clientId,
          cloudinary_public_id: upload.public_id,
          document_type: types[i],
          original_name: file.originalname,
          mime_type: file.mimetype,
          file_size: file.size,
          uploaded_by: uploadedBy,
        });
      }
    }

    if (!documentsToSave.length) return [];

    const records = await ClientDocument.bulkCreate(documentsToSave, { transaction });
    return records.map(doc => ({
      ...doc.toJSON(),
      download_url: `/api/v1/documents/${doc.id}/download`,
    }));
  }

  _formatResponse({ client, bankAccount, sale, documents, flags }) {
    return {
      client: {
        ...client.toJSON(),
        bankAccount: bankAccount.toJSON(),
        bandeiras_contratadas: flags.map(f => ({ id: f.id, name: f.name })),
      },
      sale: {
        ...sale.toJSON(),
        valor_final: sale.total_value,
      },
      documents,
    };
  }
}

module.exports = new OnboardingService(); // Exporta uma instância única