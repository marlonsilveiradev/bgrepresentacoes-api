const catchAsync = require('../../../shared/utils/catchAsync');
const ListPlansUseCase = require('../../../application/use-cases/plan/ListPlansUseCase');
const GetPlanByIdUseCase = require('../../../application/use-cases/plan/GetPlanByIdUseCase');
const CreatePlanUseCase = require('../../../application/use-cases/plan/CreatePlanUseCase');
const UpdatePlanUseCase = require('../../../application/use-cases/plan/UpdatePlanUseCase');
const DeactivatePlanUseCase = require('../../../application/use-cases/plan/DeactivatePlanUseCase');
const ReactivatePlanUseCase = require('../../../application/use-cases/plan/ReactivatePlanUseCase');
const { planRepository, flagRepository } = require('../../../infrastructure/repositories');

const list = catchAsync(async (req, res, next) => {
  const { page, limit, is_active, flag_id, search } = req.query;

  const useCase = new ListPlansUseCase(planRepository);
  const result = await useCase.execute({
    page: page ? Number.parseInt(page, 10) : 1,
    limit: limit ? Number.parseInt(limit, 10) : 20,
    is_active: is_active === undefined ? undefined : is_active === 'true' || is_active === true,
    flag_id,
    search,
  });

  return res.status(200).json({
    status: 'success',
    data: result.rows,
    pagination: {
      total: result.count,
      totalPages: result.totalPages,
      currentPage: result.currentPage,
      perPage: Number.parseInt(limit, 10) || 20,
    },
  });
});

const getById = catchAsync(async (req, res, next) => {
  const useCase = new GetPlanByIdUseCase(planRepository);
  const plan = await useCase.execute(req.params.id);
  return res.status(200).json({ status: 'success', data: plan });
});

const create = catchAsync(async (req, res, next) => {
  const useCase = new CreatePlanUseCase(planRepository, flagRepository);
  const plan = await useCase.execute(req.user, req.body);
  return res.status(201).json({
    status: 'success',
    message: 'Plano criado com sucesso.',
    data: plan,
  });
});

const update = catchAsync(async (req, res, next) => {
  const useCase = new UpdatePlanUseCase(planRepository, flagRepository);
  const plan = await useCase.execute(req.user, req.params.id, req.body);
  return res.status(200).json({
    status: 'success',
    message: 'Plano atualizado com sucesso.',
    data: plan,
  });
});

const deactivate = catchAsync(async (req, res, next) => {
  const useCase = new DeactivatePlanUseCase(planRepository);
  const result = await useCase.execute(req.user, req.params.id);
  return res.status(200).json({ status: 'success', ...result });
});

const reactivate = catchAsync(async (req, res, next) => {
  const useCase = new ReactivatePlanUseCase(planRepository);
  const result = await useCase.execute(req.user, req.params.id);
  return res.status(200).json({ status: 'success', ...result });
});

module.exports = { list, getById, create, update, deactivate, reactivate };
