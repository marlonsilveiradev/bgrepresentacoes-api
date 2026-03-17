const {
  sequelize,
  Client,
  ClientDocument,
  Sale,
  SaleFlag,
  ClientBankAccount,
  Plan,
  ClientFlag,
  Flag
} = require('../models');
const StorageService = require('./StorageService');
const logger = require('../config/logger');
const AppError = require('../utils/AppError');
const { generateProtocol } = require('../utils/protocol');

const onboardClient = async (requester, rawData, files) => {
  const uploadedPublicIds = [];

  // 1. Validação Antecipada do Plano
  const plan = await Plan.findByPk(rawData.plan_id, {
    include: [{
      model: Flag,
      as: 'flags',
      through: { attributes: [] }
    }]
  });

  if (!plan) {
    throw new AppError('O plano selecionado é inválido ou não está mais ativo.', 422);
  }

  try {
    return await sequelize.transaction(async (t) => {

      // A. Criação do Cliente
      const client = await Client.create({
        ...rawData,
        protocol: await generateProtocol(),
        created_by: requester.id,
        overall_status: 'pending'
      }, { transaction: t });

      // B. Dados Bancários
      const bankAccount = await ClientBankAccount.create({
        ...rawData,
        client_id: client.id,
      }, { transaction: t });

      // --- LÓGICA DE NEGÓCIO: PLANO VS INDIVIDUAL ---
      let flagsParaProcessar = [];
      let valorTotalVenda = 0;

      if (rawData.flag_ids && rawData.flag_ids.length > 0) {
        // REGRA INDIVIDUAL: Soma dos preços das bandeiras
        const ids = Array.isArray(rawData.flag_ids) ? rawData.flag_ids : [rawData.flag_ids];
        const selectedFlags = await Flag.findAll({ 
          where: { id: ids },
          transaction: t 
        });
        
        flagsParaProcessar = selectedFlags.map(f => ({
          id: f.id,
          name: f.name,
          price: parseFloat(f.price || 0),
          origin: 'individual'
        }));
        
        valorTotalVenda = flagsParaProcessar.reduce((acc, f) => acc + f.price, 0);
      } else {
        // REGRA PLANO: Preço fechado do plano e bandeiras herdadas
        valorTotalVenda = parseFloat(plan.price || 0);
        flagsParaProcessar = plan.flags.map(f => ({
          id: f.id,
          name: f.name,
          price: parseFloat(f.price || 0),
          origin: 'plan'
        }));
      }

      // C. Criação da Venda com o Valor Calculado
      const sale = await Sale.create({
        client_id: client.id,
        plan_id: plan.id,
        total_value: valorTotalVenda,
        plan_name: plan.name,
        plan_price: plan.price, // Preço base do plano para registro
        sold_by: requester.id,
        status: 'pending'
      }, { transaction: t });

      // D. Gravação das Bandeiras (Evita erro de Not-Null no Price)
      if (flagsParaProcessar.length > 0) {
        await SaleFlag.bulkCreate(
          flagsParaProcessar.map(f => ({
            sale_id: sale.id,
            flag_id: f.id,
            price: f.price, // Agora enviamos o preço para o banco
            status: 'pending'
          })), { transaction: t }
        );

        await ClientFlag.bulkCreate(
          flagsParaProcessar.map(f => ({
            client_id: client.id,
            flag_id: f.id,
            status: 'pending',
            origin: f.origin,
            price: f.price
          })), { transaction: t }
        );
      }

      // E. Processamento de Documentos
      const documentsToSave = [];
      
      // Upload do Contrato
      if (files.contrato?.length > 0) {
        const file = files.contrato[0];
        const upload = await StorageService.uploadToCloudinary(file.buffer, `contrato_${client.id}`);
        uploadedPublicIds.push(upload.public_id);
        documentsToSave.push({
          client_id: client.id,
          cloudinary_public_id: upload.public_id,
          document_type: 'company_document',
          original_name: file.originalname,
          mime_type: file.mimetype,
          file_size: file.size,
          uploaded_by: requester.id
        });
      }

      // Upload de outros documentos (máximo 3 tipos)
      if (files.documentos?.length > 0) {
        const types = ['proof_of_address', 'bank_account_proof', 'card_machine_proof'];
        for (let i = 0; i < Math.min(files.documentos.length, types.length); i++) {
          const file = files.documentos[i];
          const upload = await StorageService.uploadToCloudinary(file.buffer, `doc_${types[i]}_${client.id}`);
          uploadedPublicIds.push(upload.public_id);
          documentsToSave.push({
            client_id: client.id,
            cloudinary_public_id: upload.public_id,
            document_type: types[i],
            original_name: file.originalname,
            mime_type: file.mimetype,
            file_size: file.size,
            uploaded_by: requester.id
          });
        }
      }

      let savedDocs = [];
      if (documentsToSave.length > 0) {
        const records = await ClientDocument.bulkCreate(documentsToSave, { transaction: t });
        // Gera URLs assinadas para o retorno
        savedDocs = records.map(doc => {
          const docData = doc.toJSON();
          return {
            ...docData,
            download_url: `/api/v1/documents/${docData.id}/download`,
          };
        });
      }
            logger.info(
        { clientId: client.id, protocol: client.protocol, saleId: sale.id, docs: savedDocs.length },
        'Onboarding concluído com sucesso.'
      );

      return { 
        client: {
          ...client.toJSON(),
          bankAccount: bankAccount.toJSON(),
          bandeiras_contratadas: flagsParaProcessar.map(f => ({ id: f.id, name: f.name }))
        }, 
        sale: {
          ...sale.toJSON(),
          valor_final: valorTotalVenda
        }, 
        documents: savedDocs 
      };
    });

  } catch (error) {
    // Limpeza em caso de falha
    for (const id of uploadedPublicIds) {
      await StorageService.deleteFromCloudinary(id).catch(e => logger.error(e));
    }
    throw error;
  }
};

module.exports = { onboardClient };