const UserService = require('../services/UserService');
const catchAsync = require('../utils/catchAsync');

const list = catchAsync(async (req, res, next) => {
  const { page, limit, role, is_active, search } = req.query;

  const result = await UserService.listUsers({
    page:      page      ? parseInt(page, 10)      : 1,
    limit:     limit     ? parseInt(limit, 10)     : 20,
    role,
    is_active: is_active,
    search,
  });

  return res.status(200).json({
    status: 'success',
    data:        result.rows,
    pagination: {
      total:       result.count,
      totalPages:  result.totalPages,
      currentPage: result.currentPage,
      perPage:     parseInt(limit, 10) || 20,
    },
  });
});

const getById = catchAsync(async (req, res, next) => {
  const user = await UserService.getUserById(req.params.id);
  return res.status(200).json({ status: 'success', data: user });
});

const create = catchAsync(async (req, res, next) => {
  const user = await UserService.createUser(req.body);
  return res.status(201).json({ 
    status: 'success',
    message: 'Usuário criado com sucesso.', 
    data: user 
  });
});

const update = catchAsync(async (req, res, next) => {
  const user = await UserService.updateUser(req.params.id, req.user.id, req.body);
  return res.status(200).json({ 
    status: 'success',
    message: 'Usuário atualizado com sucesso.', 
    data: user 
  });
});

const deactivate = catchAsync(async (req, res, next) => {
  const result = await UserService.deactivateUser(req.params.id, req.user.id);
  return res.status(200).json({ status: 'success', ...result });
});

const reactivate = catchAsync(async (req, res, next) => {
  const result = await UserService.reactivateUser(req.params.id, req.user.id);
  return res.status(200).json({ status: 'success', ...result });
});

const getProfile = catchAsync(async (req, res, next) => {
  const user = await UserService.getUserById(req.user.id);

  // 🔥 REGRA CENTRAL DO SEU SISTEMA
  const mustChangePassword = user.last_login_at === null;

  return res.status(200).json({
    status: 'success',
    data: {
      ...user.toJSON(),
      mustChangePassword, 
    },
  });
});

const updateProfile = catchAsync(async (req, res, next) => {
  const user = await UserService.updateProfile(req.user.id, req.body);
  return res.status(200).json({ 
    status: 'success',
    message: 'Perfil atualizado com sucesso.', 
    data: user 
  });
});

module.exports = { 
  list, 
  getById, 
  create, 
  update, 
  deactivate, 
  reactivate, 
  getProfile, 
  updateProfile 
};