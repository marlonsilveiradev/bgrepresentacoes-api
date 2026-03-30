const PlanService = require('../services/PlanService');
const catchAsync = require('../utils/catchAsync');

const list = catchAsync(async (req, res, next) => {
  const { page, limit, is_active, flag_id, search } = req.query;

  const result = await PlanService.listPlans({
    page:      page  ? Number.parseInt(page, 10)  : 1,
    limit:     limit ? Number.parseInt(limit, 10) : 20,
    is_active: is_active === undefined ? undefined : is_active === 'true',
    flag_id,
    search,
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
  const plan = await PlanService.getPlanById(req.params.id);
  return res.status(200).json({ status: 'success', data: plan });
});

const create = catchAsync(async (req, res, next) => {
  const plan = await PlanService.createPlan(req.body);
  return res.status(201).json({ 
    status: 'success',
    message: 'Plano criado com sucesso.', 
    data: plan 
  });
});

const update = catchAsync(async (req, res, next) => {
  const plan = await PlanService.updatePlan(req.params.id, req.body);
  return res.status(200).json({ 
    status: 'success',
    message: 'Plano atualizado com sucesso.', 
    data: plan 
  });
});

const deactivate = catchAsync(async (req, res, next) => {
  const result = await PlanService.deactivatePlan(req.params.id);
  return res.status(200).json({ status: 'success', ...result });
});

const reactivate = catchAsync(async (req, res, next) => {
  const result = await PlanService.reactivatePlan(req.params.id);
  return res.status(200).json({ status: 'success', ...result });
});

module.exports = { list, getById, create, update, deactivate, reactivate };