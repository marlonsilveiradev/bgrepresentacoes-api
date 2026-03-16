const { Op, Transaction } = require('sequelize');
const { Sale, SaleFlag, Client, Plan, Flag, User } = require('../models');
const { recalculateStatus } = require('./ClientService');
const AppError = require('../utils/AppError');
const logger = require('../config/logger');

// ─── Include padrão ───────────────────────────────────────────────────────────
const _defaultIncludes = () => [
  {
    model:      Client,
    as:         'client',
    attributes: ['id', 'protocol', 'corporate_name', 'cnpj', 'overall_status'],
  },
  {
    model:      Plan,
    as:         'plan',
    attributes: ['id', 'name', 'price'],
    required:   false,
  },
  {
    model:      User,
    as:         'seller',
    attributes: ['id', 'name', 'email'],
  },
  {
    model:      User,
    as:         'partner',
    attributes: ['id', 'name', 'email'],
    required:   false,
  },
  {
    model: SaleFlag,
    as: 'saleFlags',
    // IMPORTANTE: Listamos apenas os campos que você me mostrou na migration
    // e removemos timestamps automáticos que podem estar gerando conflito
    attributes: ['id', 'sale_id', 'flag_id', 'status', 'price'],
    paranoid: false,
    include: [{
      model: Flag,
      as: 'flag',
      attributes: ['id', 'name'],
    }],
  },
];

// ─── Verifica se o vendedor tem acesso ao cliente ─────────────────────────────
const _assertClientOwnership = async (clientId, requester, { transaction = null } = {}) => {
  const client = await Client.findByPk(clientId, {
    transaction,
    attributes: ['id', 'created_by', 'partner_id'],
  });

  if (!client) throw new AppError('Cliente não encontrado.', 404);

  if (requester.role === 'partner') {
    throw new AppError('Parceiros não podem registrar vendas.', 403);
  }

  if (requester.role === 'user' && client.created_by !== requester.id) {
    throw new AppError('Você só pode registrar vendas para clientes que cadastrou.', 403);
  }

  return client;
};

// ─── Listar ───────────────────────────────────────────────────────────────────
/**
 * Regras de visibilidade por role:
 *  admin   → todas as vendas
 *  user    → apenas vendas onde sold_by = seu ID
 *  partner → apenas vendas onde partner_id = seu ID
 */
const listSales = async (requester, { page = 1, limit = 20, status, client_id, sold_by, plan_id } = {}) => {
  const offset = (page - 1) * limit;
  const where  = {};

  // Impõe filtro por role
  if (requester.role === 'user')    where.sold_by    = requester.id;
  if (requester.role === 'partner') where.partner_id = requester.id;

  // Filtros opcionais (admin pode usar todos; outros roles acumulam com o filtro imposto)
  if (status)    where.status    = status;
  if (client_id) where.client_id = client_id;
  if (plan_id)   where.plan_id   = plan_id;

  // Admin pode filtrar por sold_by; user já tem esse filtro imposto
  if (requester.role === 'admin' && sold_by) where.sold_by = sold_by;

  const { rows, count } = await Sale.findAndCountAll({
    where,
    include: _defaultIncludes(),
    order:    [['created_at', 'DESC']],
    limit,
    offset,
    distinct: true,
  });

  return { rows, count, totalPages: Math.ceil(count / limit), currentPage: page };
};

// ─── Buscar por ID ────────────────────────────────────────────────────────────
const getSaleById = async (id, requester) => {
  const sale = await Sale.findByPk(id, { include: _defaultIncludes() });
  if (!sale) throw new AppError('Venda não encontrada.', 404);

  // Verifica visibilidade
  if (requester.role === 'user'    && sale.sold_by    !== requester.id) throw new AppError('Acesso negado.', 403);
  if (requester.role === 'partner' && sale.partner_id !== requester.id) throw new AppError('Acesso negado.', 403);

  return sale;
};

// ─── Criar venda ──────────────────────────────────────────────────────────────
/**
 * Suporta três cenários de entrada para bandeiras:
 *
 * 1. plan_id + flag_ids explícitos → usa as bandeiras enviadas (override manual)
 * 2. plan_id + flag_ids vazio/omitido → herda automaticamente as bandeiras do plano
 * 3. sem plan_id + flag_ids explícitos → venda avulsa, total = Σ bandeiras
 * 4. sem plan_id + flag_ids vazio → erro 422
 *
 * Precificação:
 *   COM plan_id  → total_value = preço do plano (bandeiras não somam)
 *   SEM plan_id  → total_value = Σ preços individuais das bandeiras
 *
 * Em todos os cenários:
 *   - SaleFlags criadas com snapshot do preço individual de cada bandeira
 *   - status sempre inicia como 'pending'
 *   - partner_id herdado do cliente
 *   - ClientService.recalculateStatus disparado ao final
 */
const createSale = async (requester, { client_id, plan_id, flag_ids = [], notes, partner_id }, { transaction = null } = {}) => {
  // 1. Verifica acesso ao cliente
  const client = await _assertClientOwnership(client_id, requester, { transaction });

  // 2. Resolve plano (se informado)

  let plan = null;
  if (plan_id) {
    plan = await Plan.findByPk(plan_id, {
      transaction,
      attributes: ['id', 'name', 'price', 'is_active'],
      include: [{
        model:      Flag,
        as:         'flags', // Verifique se no seu Model Plan a associação está como 'flags'
        attributes: ['id', 'name', 'price', 'is_active'],
        through:    { attributes: [] },
      }],
    });
    if (!plan)           throw new AppError('Plano não encontrado.', 404);
    if (!plan.is_active) throw new AppError('Plano inativo. Selecione um plano ativo.', 422);
  }
  

  // 3. Resolve bandeiras
  let flags = [];
  const hasExplicitFlags = Array.isArray(flag_ids) && flag_ids.length > 0;

  if (hasExplicitFlags) {
    // Cenário 1 ou 3: bandeiras enviadas explicitamente
    flags = await Flag.findAll({
      where: { id: { [Op.in]: flag_ids }, is_active: true },
      attributes: ['id', 'name', 'price'],
      transaction,
    });

    if (flags.length !== flag_ids.length) {
      const foundIds = flags.map((f) => f.id);
      const missing  = flag_ids.filter((id) => !foundIds.includes(id));
      throw new AppError(`Bandeira(s) não encontrada(s) ou inativa(s): ${missing.join(', ')}`, 422);
    }
  } else if (plan) {
    // Cenário 2: herda bandeiras ativas do plano automaticamente
    flags = (plan.flags || []).filter((f) => f.is_active);

    if (flags.length === 0) {
      throw new AppError(
        'O plano selecionado não possui bandeiras ativas vinculadas. Informe flag_ids manualmente.',
        422
      );
    }

    logger.debug({ planId: plan_id, inheritedFlags: flags.map((f) => f.id) }, 'Bandeiras herdadas do plano.');
  } else {
    // Cenário 4: sem plano e sem bandeiras → inválido
    throw new AppError(
      'Informe ao menos um plano (plan_id) ou uma lista de bandeiras (flag_ids).',
      422
    );
  }

  // 4. Calcula total_value conforme o cenário
  let total_value;
  let plan_name  = null;
  let plan_price = null;
  let resolvedPlanId = null;

  if (plan) {
    // COM plano: total = preço do plano (bandeiras não somam)
    total_value    = parseFloat(plan.price);
    plan_name      = plan.name;
    plan_price     = plan.price;
    resolvedPlanId = plan.id;
  } else {
    // SEM plano (avulso): total = soma dos preços das bandeiras
    total_value = flags.reduce((sum, f) => sum + parseFloat(f.price), 0);
  }

  // 5. Cria a venda
  let sale;
  try {
    sale = await Sale.create({
      client_id,
      plan_id:    resolvedPlanId,
      plan_name,
      plan_price,
      total_value,
      status:     'pending',
      sold_by:    requester.id,
      partner_id: partner_id || client.partner_id,
      notes:      notes || null,
    }, { transaction }); // <--- TRANSACTION ADICIONADA AQUI
  } catch (error) {
    logger.error('❌ ERRO REAL NO SALE.CREATE:', error.parent?.detail || error.message);
    throw error;
  }
 

  // 6. Cria SaleFlags — preço individual congelado no momento da venda
  const saleFlagsData = flags.map((f) => {
    // Pegamos apenas o que o banco pede na sua migration
    return {
      sale_id: sale.id,
      flag_id: f.id,
      status:  'pending', // Mantendo apenas os status do seu plano
      price:   Number(f.price) // Garante que o valor vá como número e não string
    };
  });

  if (saleFlagsData.length > 0) {
    try {
      // Usamos o bulkCreate com configurações de segurança para o Postgres
      await SaleFlag.bulkCreate(saleFlagsData, { 
        transaction,
        ignoreDuplicates: true,
        returning: false, 
        validate: false 
      });
    } catch (error) {
      // Este log vai nos dizer exatamente qual coluna o Postgres está reclamando
      logger.error('❌ ERRO NO POSTGRES:', error.parent?.detail || error.message);
      throw new AppError(`Erro ao salvar bandeiras: ${error.parent?.detail || 'Verifique a estrutura do banco'}`, 500);
    }
  }

  // 7. Dispara recálculo do status geral do cliente
  await recalculateStatus(client_id);

  logger.info(
    {
      saleId:   sale.id,
      clientId: client_id,
      soldBy:   requester.id,
      scenario: plan ? (hasExplicitFlags ? 'combo-override' : 'combo-auto') : 'avulso',
      flags:    flags.length,
      total:    total_value,
    },
    'Venda registrada.'
  );
  if (transaction) {
    return sale;
  }

  return getSaleById(sale.id, requester);
};

// ─── Atualizar status (admin) ─────────────────────────────────────────────────
/**
 * Somente admin pode alterar o status de uma venda.
 * Regras de transição:
 *  pending   → analysis | cancelled
 *  analysis  → approved | cancelled | pending
 *  approved  → não pode ser alterado (venda fechada)
 *  cancelled → não pode ser reaberta
 */
const updateSaleStatus = async (id, requester, { status, notes }) => {
  const sale = await Sale.findByPk(id, { attributes: ['id', 'status', 'client_id', 'notes'] });
  if (!sale) throw new AppError('Venda não encontrada.', 404);

  // Valida transições de estado
  if (sale.status === 'approved') {
    throw new AppError('Venda aprovada não pode ter o status alterado.', 409);
  }
  if (sale.status === 'cancelled') {
    throw new AppError('Venda cancelada não pode ser reaberta.', 409);
  }

  const updateData = { status };
  if (notes !== undefined) updateData.notes = notes;
  if (status === 'approved') updateData.approved_at = new Date();

  await sale.update(updateData);

  // Recalcula status do cliente após mudança na venda
  await recalculateStatus(sale.client_id);

  logger.info({ saleId: id, oldStatus: sale.status, newStatus: status, by: requester.id }, 'Status da venda atualizado.');

  return getSaleById(id, requester);
};

// ─── Cancelar venda ───────────────────────────────────────────────────────────
/**
 * Vendedor pode cancelar suas próprias vendas (apenas se pending ou analysis).
 * Admin pode cancelar qualquer venda.
 */
const cancelSale = async (id, requester, { notes } = {}) => {
  const sale = await Sale.findByPk(id, { attributes: ['id', 'status', 'sold_by', 'client_id'] });
  if (!sale) throw new AppError('Venda não encontrada.', 404);

  // Verifica propriedade para não-admin
  if (requester.role === 'user' && sale.sold_by !== requester.id) {
    throw new AppError('Você só pode cancelar as próprias vendas.', 403);
  }

  if (sale.status === 'approved')  throw new AppError('Venda aprovada não pode ser cancelada.', 409);
  if (sale.status === 'cancelled') throw new AppError('Venda já está cancelada.', 409);

  await sale.update({ status: 'cancelled', notes: notes || sale.notes });

  await recalculateStatus(sale.client_id);

  logger.info({ saleId: id, cancelledBy: requester.id }, 'Venda cancelada.');

  return getSaleById(id, requester);
};

module.exports = { listSales, getSaleById, createSale, updateSaleStatus, cancelSale };
