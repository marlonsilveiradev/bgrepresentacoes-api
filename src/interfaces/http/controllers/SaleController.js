const SaleService = require('../../../infrastructure/services/SaleService');
const catchAsync = require('../../../shared/utils/catchAsync');

/**
 * @module SaleController
 */

const list = catchAsync(async (req, res, next) => {
  const { page, limit, status, client_id, sold_by, plan_id } = req.query;

  const result = await SaleService.listSales(req.user, {
    page:      page  ? Number.parseInt(page, 10)  : 1,
    limit:     limit ? Number.parseInt(limit, 10) : 20,
    status,
    client_id,
    sold_by,
    plan_id,
  });

  return res.status(200).json({
    status: 'success',
    data: result.rows,
    pagination: {
      total:       result.count,
      totalPages:  result.totalPages,
      currentPage: result.currentPage,
      perPage:     Number.parseInt(limit, 10) || 20,
    },
  });
});

const getById = catchAsync(async (req, res, next) => {
  const sale = await SaleService.getSaleById(req.params.id, req.user);
  return res.status(200).json({ status: 'success', data: sale });
});

const create = catchAsync(async (req, res, next) => {
  const sale = await SaleService.createSale(req.user, req.body);
  return res.status(201).json({
    status: 'success',
    message: 'Venda registrada com sucesso.',
    data:    sale,
  });
});

const updateStatus = catchAsync(async (req, res, next) => {
  const sale = await SaleService.updateSaleStatus(req.params.id, req.user, req.body);
  return res.status(200).json({
    status: 'success',
    message: 'Status da venda atualizado.',
    data:    sale,
  });
});

const cancel = catchAsync(async (req, res, next) => {
  const sale = await SaleService.cancelSale(req.params.id, req.user, req.body);
  return res.status(200).json({
    status: 'success',
    message: 'Venda cancelada com sucesso.',
    data:    sale,
  });
});

module.exports = { list, getById, create, updateStatus, cancel };