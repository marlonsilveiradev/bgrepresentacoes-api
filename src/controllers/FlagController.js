const FlagService = require('../services/FlagService');
const catchAsync = require('../utils/catchAsync');

// GET /api/v1/flags
const list = catchAsync(async (req, res, next) => {
  const { page, limit, is_active, search } = req.query;

  const result = await FlagService.listFlags({
    page:      page  ? parseInt(page, 10)  : 1,
    limit:     limit ? parseInt(limit, 10) : 20,
    is_active: is_active !== undefined ? is_active === 'true' : undefined,
    search,
  });

  return res.status(200).json({
    status: 'success',
    data: result.rows,
    pagination: {
      total:       result.count,
      totalPages:  result.totalPages,
      currentPage: result.currentPage,
      perPage:     parseInt(limit, 10) || 20,
    },
  });
});

// GET /api/v1/flags/:id
const getById = catchAsync(async (req, res, next) => {
  const flag = await FlagService.getFlagById(req.params.id);
  
  return res.status(200).json({ 
    status: 'success',
    data: flag 
  });
});

// POST /api/v1/flags
const create = catchAsync(async (req, res, next) => {
  const flag = await FlagService.createFlag(req.body);
  
  return res.status(201).json({ 
    status: 'success',
    message: 'Bandeira criada com sucesso.', 
    data: flag 
  });
});

// PATCH /api/v1/flags/:id
const update = catchAsync(async (req, res, next) => {
  const flag = await FlagService.updateFlag(req.params.id, req.body);
  
  return res.status(200).json({ 
    status: 'success',
    message: 'Bandeira atualizada com sucesso.', 
    data: flag 
  });
});

// PATCH /api/v1/flags/:id/deactivate
const deactivate = catchAsync(async (req, res, next) => {
  const result = await FlagService.deactivateFlag(req.params.id);
  
  return res.status(200).json({
    status: 'success',
    ...result
  });
});

// PATCH /api/v1/flags/:id/reactivate
const reactivate = catchAsync(async (req, res, next) => {
  const result = await FlagService.reactivateFlag(req.params.id);
  
  return res.status(200).json({
    status: 'success',
    ...result
  });
});

module.exports = { 
  list, 
  getById, 
  create, 
  update, 
  deactivate, 
  reactivate 
};