/**
 * CONTROLLER DE CLIENTES
 */

const { Client, Plan, Flag, ClientFlag, User } = require('../models');
const { uploadMultipleFiles, cleanupTempFiles, uploadFile, replaceFile } = require('../services/cloudinaryService');
const { createSalesReport } = require('../services/salesReportService');
const { generateProtocol } = require('../utils/protocolGenerator');
const { Op } = require('sequelize');

/**
 * CRIAR CLIENTE
 * POST /api/clients
 */
async function createClient(req, res) {
    try {
        const {
            name, razao_social, ramo_atividade, tipo_cartao,
            rua, numero, complemento, bairro, cidade, estado, cep,
            cnpj, inscricao_estadual,
            email, telefone,
            banco, agencia, conta, digito,
            plan_id, selected_flags, partner_id, notes
        } = req.body;

        // 1. Verifica se CNPJ ou email já existem
        const existingClient = await Client.findOne({
            where: {
                [Op.or]: [
                    { cnpj },
                    { email }
                ]
            }
        });

        if (existingClient) {
            await cleanupTempFiles(req.files);
            return res.status(400).json({
                success: false,
                error: existingClient.cnpj === cnpj ? 'CNPJ já cadastrado' : 'Email já cadastrado'
            });
        }

        // 2. Verifica se o plano existe
        const plan = await Plan.findByPk(plan_id);

        if (!plan || !plan.is_active) {
            await cleanupTempFiles(req.files);
            return res.status(400).json({
                success: false,
                error: 'Plano não encontrado ou inativo'
            });
        }

        // 3. Busca as bandeiras selecionadas
        const flags = await Flag.findAll({
            where: {
                id: selected_flags,
                is_active: true
            }
        });

        if (flags.length !== selected_flags.length) {
            await cleanupTempFiles(req.files);
            return res.status(400).json({
                success: false,
                error: 'Uma ou mais bandeiras inválidas ou inativas'
            });
        }

        // 4. Valida quantidade de bandeiras conforme o plano
        if (plan.code === 'combo_5' && flags.length !== 5) {
            await cleanupTempFiles(req.files);
            return res.status(400).json({
                success: false,
                error: 'Plano Combo 5 requer exatamente 5 bandeiras'
            });
        }

        if (plan.code === 'combo_7' && flags.length !== 7) {
            await cleanupTempFiles(req.files);
            return res.status(400).json({
                success: false,
                error: 'Plano Combo 7 requer exatamente 7 bandeiras'
            });
        }

        // 5. Calcula valor total
        let total_value;

        if (plan.code === 'individual') {
            // Soma dos preços individuais das bandeiras
            total_value = flags.reduce((sum, flag) => sum + parseFloat(flag.price), 0);
        } else {
            // Preço fixo do combo
            total_value = parseFloat(plan.price);
        }

        // 6. Faz upload dos arquivos
        const fileUrls = await uploadMultipleFiles(req.files);

        // 7. Gera protocolo único
        let protocol;
        let protocolExists = true;
        let attempts = 0;

        while (protocolExists && attempts < 10) {
            protocol = generateProtocol();
            const existing = await Client.findOne({ where: { protocol } });
            protocolExists = !!existing;
            attempts++;
        }

        if (protocolExists) {
            await cleanupTempFiles(req.files);
            return res.status(500).json({
                success: false,
                error: 'Erro ao gerar protocolo único'
            });
        }

        // 8. Cria o cliente
        const client = await Client.create({
            name,
            razao_social,
            ramo_atividade,
            tipo_cartao,
            rua,
            numero,
            complemento,
            bairro,
            cidade,
            estado,
            cep,
            cnpj,
            inscricao_estadual,
            email,
            telefone,
            banco,
            agencia,
            conta,
            digito,
            protocol,
            plan_id,
            total_value,
            document_url: fileUrls.document_url,
            invoice_url: fileUrls.invoice_url,
            energy_bill_url: fileUrls.energy_bill_url,
            status: 'pending',
            notes,
            created_by: req.user.id,
            partner_id: partner_id || null
        });

        // 9. Cria registros na tabela client_flags (status individual por bandeira)
        const clientFlagsData = flags.map(flag => ({
            client_id: client.id,
            flag_id: flag.id,
            flag_name: flag.name,
            flag_price: flag.price,
            status: 'pending'
        }));

        await ClientFlag.bulkCreate(clientFlagsData);

        // 10. Cria relatório de venda
        await createSalesReport(client, req.user);

        // 11. Retorna cliente criado com bandeiras
        const clientWithFlags = await Client.findByPk(client.id, {
            include: [
                { model: Plan, as: 'plan' },
                {
                    model: ClientFlag,
                    as: 'client_flags',
                    include: [{ model: Flag, as: 'flag' }]
                },
                { model: User, as: 'partner', attributes: ['id', 'name', 'email'] }
            ]
        });

        return res.status(201).json({
            success: true,
            message: 'Cliente cadastrado com sucesso',
            data: clientWithFlags
        });

    } catch (error) {
        console.error('Erro ao criar cliente:', error);
        await cleanupTempFiles(req.files);

        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({
                success: false,
                error: 'Dados inválidos',
                details: error.errors.map(e => e.message)
            });
        }

        return res.status(500).json({
            success: false,
            error: 'Erro ao criar cliente'
        });
    }
}

/**
 * LISTAR CLIENTES
 * GET /api/clients
 */
async function listClients(req, res) {
    try {
        const { status, search, page = 1, limit = 20 } = req.query;

        const where = {};

        // Filtro de permissão por role
        if (req.user.role === 'user') {
            // User só vê seus próprios clientes
            where.created_by = req.user.id;
        } else if (req.user.role === 'partner') {
            // Partner só vê clientes onde ele é o partner
            where.partner_id = req.user.id;
        }
        // Admin vê todos (não adiciona filtro)

        // Filtros adicionais
        if (status) where.status = status;

        if (search) {
            where[Op.or] = [
                { name: { [Op.iLike]: `%${search}%` } },
                { razao_social: { [Op.iLike]: `%${search}%` } },
                { email: { [Op.iLike]: `%${search}%` } },
                { protocol: { [Op.iLike]: `%${search}%` } },
                { cnpj: { [Op.iLike]: `%${search}%` } }
            ];
        }

        const offset = (page - 1) * limit;

        const { count, rows: clients } = await Client.findAndCountAll({
            where,
            include: [
                { model: Plan, as: 'plan' },
                { model: User, as: 'creator', attributes: ['id', 'name'] },
                { model: User, as: 'partner', attributes: ['id', 'name'] },
                {
                    model: ClientFlag,
                    as: 'client_flags',
                    include: [{ model: Flag, as: 'flag' }]
                }
            ],
            limit: parseInt(limit),
            offset: offset,
            order: [['created_at', 'DESC']]
        });

        // Se for partner, retorna apenas dados limitados
        if (req.user.role === 'partner') {
            const limitedClients = clients.map(client => ({
                id: client.id,
                name: client.name,
                razao_social: client.razao_social,
                tipo_cartao: client.tipo_cartao,
                telefone: client.telefone,
                status: client.status,
                notes: client.notes,
                client_flags: client.client_flags.map(cf => ({
                    flag_name: cf.flag_name,
                    status: cf.status
                }))
            }));

            return res.status(200).json({
                success: true,
                data: {
                    clients: limitedClients,
                    pagination: {
                        total: count,
                        page: parseInt(page),
                        limit: parseInt(limit),
                        pages: Math.ceil(count / limit)
                    }
                }
            });
        }

        return res.status(200).json({
            success: true,
            data: {
                clients,
                pagination: {
                    total: count,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    pages: Math.ceil(count / limit)
                }
            }
        });

    } catch (error) {
        console.error('Erro ao listar clientes:', error);
        return res.status(500).json({
            success: false,
            error: 'Erro ao listar clientes'
        });
    }
}

/**
 * BUSCAR CLIENTE POR ID
 * GET /api/clients/:id
 */
async function getClientById(req, res) {
    try {
        const { id } = req.params;

        const client = await Client.findByPk(id, {
            include: [
                { model: Plan, as: 'plan' },
                { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
                { model: User, as: 'partner', attributes: ['id', 'name', 'email'] },
                {
                    model: ClientFlag,
                    as: 'client_flags',
                    include: [{ model: Flag, as: 'flag' }]
                }
            ]
        });

        if (!client) {
            return res.status(404).json({
                success: false,
                error: 'Cliente não encontrado'
            });
        }

        // Verifica permissões
        if (req.user.role === 'user' && client.created_by !== req.user.id) {
            return res.status(403).json({
                success: false,
                error: 'Acesso negado'
            });
        }

        if (req.user.role === 'partner') {
            if (client.partner_id !== req.user.id) {
                return res.status(403).json({
                    success: false,
                    error: 'Acesso negado'
                });
            }

            // Retorna dados limitados
            return res.status(200).json({
                success: true,
                data: client.toPartnerView()
            });
        }

        return res.status(200).json({
            success: true,
            data: client
        });

    } catch (error) {
        console.error('Erro ao buscar cliente:', error);
        return res.status(500).json({
            success: false,
            error: 'Erro ao buscar cliente'
        });
    }
}

/**
 * ATUALIZAR CLIENTE
 * PUT /api/clients/:id
 */
async function updateClient(req, res) {
    try {
        const { id } = req.params;

        const client = await Client.findByPk(id);

        if (!client) {
            return res.status(404).json({
                success: false,
                error: 'Cliente não encontrado'
            });
        }

        // Verifica permissões
        if (req.user.role === 'user' && client.created_by !== req.user.id) {
            return res.status(403).json({
                success: false,
                error: 'Você só pode editar seus próprios clientes'
            });
        }

        // Atualiza campos permitidos
        const allowedFields = [
            'name', 'razao_social', 'ramo_atividade', 'tipo_cartao',
            'rua', 'numero', 'complemento', 'bairro', 'cidade', 'estado', 'cep',
            'email', 'telefone',
            'banco', 'agencia', 'conta', 'digito',
            'partner_id', 'notes'
        ];

        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                client[field] = req.body[field];
            }
        });

        await client.save();

        const updatedClient = await Client.findByPk(client.id, {
            include: [
                { model: Plan, as: 'plan' },
                {
                    model: ClientFlag,
                    as: 'client_flags',
                    include: [{ model: Flag, as: 'flag' }]
                }
            ]
        });

        return res.status(200).json({
            success: true,
            message: 'Cliente atualizado com sucesso',
            data: updatedClient
        });

    } catch (error) {
        console.error('Erro ao atualizar cliente:', error);
        return res.status(500).json({
            success: false,
            error: 'Erro ao atualizar cliente'
        });
    }
}

/**
 * DELETAR CLIENTE (apenas admin)
 * DELETE /api/clients/:id
 */
async function deleteClient(req, res) {
    try {
        const { id } = req.params;

        const client = await Client.findByPk(id);

        if (!client) {
            return res.status(404).json({
                success: false,
                error: 'Cliente não encontrado'
            });
        }

        await client.destroy();

        return res.status(200).json({
            success: true,
            message: 'Cliente deletado com sucesso'
        });

    } catch (error) {
        console.error('Erro ao deletar cliente:', error);
        return res.status(500).json({
            success: false,
            error: 'Erro ao deletar cliente'
        });
    }
}

/**
 * ATUALIZAR STATUS DE BANDEIRA INDIVIDUAL
 * PATCH /api/clients/:clientId/flags/:flagId/status
 */
async function updateFlagStatus(req, res) {
    try {
        const { clientId, flagId } = req.params;
        const { status } = req.body;

        // Busca o client_flag
        const clientFlag = await ClientFlag.findOne({
            where: {
                client_id: clientId,
                flag_id: flagId
            },
            include: [
                { model: Client, as: 'client' }
            ]
        });

        if (!clientFlag) {
            return res.status(404).json({
                success: false,
                error: 'Bandeira não encontrada para este cliente'
            });
        }

        // Verifica permissões
        if (req.user.role === 'user' && clientFlag.client.created_by !== req.user.id) {
            return res.status(403).json({
                success: false,
                error: 'Você só pode alterar status dos seus próprios clientes'
            });
        }

        // Atualiza status
        clientFlag.status = status;
        clientFlag.status_updated_at = new Date();
        clientFlag.status_updated_by = req.user.id;

        await clientFlag.save();

        // O hook do model ClientFlag vai recalcular o status geral do cliente

        return res.status(200).json({
            success: true,
            message: 'Status da bandeira atualizado com sucesso',
            data: clientFlag
        });

    } catch (error) {
        console.error('Erro ao atualizar status:', error);
        return res.status(500).json({
            success: false,
            error: 'Erro ao atualizar status'
        });
    }
}

/**
 * CONSULTA PÚBLICA (por protocolo ou CNPJ)
 * GET /api/public/check-status
 */
async function publicCheckStatus(req, res) {
    try {
        const { protocol, cnpj } = req.query;

        const where = {};

        if (protocol) {
            where.protocol = protocol;
        } else if (cnpj) {
            where.cnpj = cnpj.replace(/[^\d]/g, '');
        } else {
            return res.status(400).json({
                success: false,
                error: 'Informe protocolo ou CNPJ'
            });
        }

        const client = await Client.findOne({ where });

        if (!client) {
            return res.status(404).json({
                success: false,
                error: 'Nenhum cadastro encontrado'
            });
        }

        const publicData = await client.toPublicView();

        return res.status(200).json({
            success: true,
            data: publicData
        });

    } catch (error) {
        console.error('Erro na consulta pública:', error);
        return res.status(500).json({
            success: false,
            error: 'Erro ao consultar status'
        });
    }
}

/**
 * ATUALIZAR DOCUMENTOS DO CLIENTE
 * PUT /api/clients/:id/documents
 */
async function updateClientDocuments(req, res) {
    try {
        const { id } = req.params;

        // Busca o cliente
        const client = await Client.findByPk(id);

        if (!client) {
            await cleanupTempFiles(req.files);
            return res.status(404).json({
                success: false,
                error: 'Cliente não encontrado'
            });
        }

        // Verifica permissões
        if (req.user.role === 'user' && client.created_by !== req.user.id) {
            await cleanupTempFiles(req.files);
            return res.status(403).json({
                success: false,
                error: 'Você só pode editar documentos dos seus próprios clientes'
            });
        }

        if (req.user.role === 'partner') {
            await cleanupTempFiles(req.files);
            return res.status(403).json({
                success: false,
                error: 'Partners não podem editar documentos'
            });
        }

        // Verifica se pelo menos um arquivo foi enviado
        if (!req.files || Object.keys(req.files).length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Nenhum arquivo foi enviado'
            });
        }

        // Processa uploads dos arquivos enviados
        const updates = {};

        // Document
        if (req.files.document && req.files.document[0]) {
            const documentResult = await replaceFile(
                client.document_url,
                req.files.document[0],
                'card-flags/documents'
            );
            updates.document_url = documentResult.url;
        }

        // Invoice
        if (req.files.invoice && req.files.invoice[0]) {
            const invoiceResult = await replaceFile(
                client.invoice_url,
                req.files.invoice[0],
                'card-flags/invoices'
            );
            updates.invoice_url = invoiceResult.url;
        }

        // Energy Bill
        if (req.files.energy_bill && req.files.energy_bill[0]) {
            const energyBillResult = await replaceFile(
                client.energy_bill_url,
                req.files.energy_bill[0],
                'card-flags/energy-bills'
            );
            updates.energy_bill_url = energyBillResult.url;
        }

        // Atualiza o cliente
        await client.update(updates);

        // Busca cliente atualizado
        const updatedClient = await Client.findByPk(client.id, {
            include: [
                { model: Plan, as: 'plan' },
                {
                    model: ClientFlag,
                    as: 'client_flags',
                    include: [{ model: Flag, as: 'flag' }]
                }
            ]
        });

        return res.status(200).json({
            success: true,
            message: 'Documentos atualizados com sucesso',
            data: updatedClient
        });

    } catch (error) {
        console.error('Erro ao atualizar documentos:', error);
        await cleanupTempFiles(req.files);

        return res.status(500).json({
            success: false,
            error: 'Erro ao atualizar documentos'
        });
    }
}

module.exports = {
    createClient,
    listClients,
    getClientById,
    updateClient,
    deleteClient,
    updateFlagStatus,
    publicCheckStatus,
    updateClientDocuments
};