/**
 * CONTROLLER: UserController
 * Responsabilidade: APENAS HTTP
 */

const catchAsync = require('../../../shared/utils/catchAsync');
const { userContainer } = require('../../../infrastructure/container');
const { UserPresenter } = require('../../../application/presenters/user');
const {
  ListUsersQueryDTO,
  CreateUserDTO,
  UpdateUserDTO,
  UpdateProfileDTO,
} = require('../../../application/dtos/user');

class UserController {
  /**
   * GET /api/v1/users
   * Listar usuários
   */
  static list = catchAsync(async (req, res) => {
    const { page, limit, role, is_active, search } = req.query;

    const queryDTO = new ListUsersQueryDTO({
      page,
      limit,
      role,
      is_active,
      search,
    });

    const useCase = userContainer.getListUsersUseCase();
    const result = await useCase.execute(queryDTO);

    const response = UserPresenter.toListWithPagination(result);

    return res.status(200).json({
      status: 'success',
      data: response.data,
      pagination: response.pagination,
    });
  });

  /**
   * GET /api/v1/users/:id
   * Buscar usuário por ID
   */
  static getById = catchAsync(async (req, res) => {
    const { id } = req.params;

    const useCase = userContainer.getGetUserByIdUseCase();
    const user = await useCase.execute(id);

    const response = UserPresenter.toResponse(user);

    return res.status(200).json({
      status: 'success',
      data: response,
    });
  });

  /**
   * POST /api/v1/users
   * Criar usuário com senha temporária
   */
  static create = catchAsync(async (req, res) => {
    const createDTO = CreateUserDTO.validate(req.body);

    const useCase = userContainer.getCreateUserUseCase();
    const result = await useCase.execute(createDTO);

    const response = UserPresenter.toCreateResponse(result.user, result.temporaryPassword);

    return res.status(201).json({
      status: 'success',
      message: 'Usuário criado com senha temporária.',
      data: response,
    });
  });

  /**
   * PATCH /api/v1/users/:id
   * Atualizar usuário (admin)
   */
  static update = catchAsync(async (req, res) => {
    const { id } = req.params;
    const updateDTO = UpdateUserDTO.validate(req.body);

    const useCase = userContainer.getUpdateUserUseCase();
    const user = await useCase.execute(id, req.user.id, updateDTO);

    const response = UserPresenter.toResponse(user);

    return res.status(200).json({
      status: 'success',
      message: 'Usuário atualizado com sucesso.',
      data: response,
    });
  });

  /**
   * PATCH /api/v1/users/profile
   * Atualizar perfil do próprio usuário
   */
  static updateProfile = catchAsync(async (req, res) => {
    const updateProfileDTO = UpdateProfileDTO.validate(req.body);

    const useCase = userContainer.getUpdateProfileUseCase();
    const user = await useCase.execute(req.user.id, updateProfileDTO);

    const response = UserPresenter.toResponse(user);

    return res.status(200).json({
      status: 'success',
      message: 'Perfil atualizado com sucesso.',
      data: response,
    });
  });

  /**
   * PATCH /api/v1/users/:id/deactivate
   * Desativar usuário
   */
  static deactivate = catchAsync(async (req, res) => {
    const { id } = req.params;

    const useCase = userContainer.getDeactivateUserUseCase();
    const result = await useCase.execute(id, req.user.id);

    return res.status(200).json({
      status: 'success',
      message: result.message,
    });
  });

  /**
   * PATCH /api/v1/users/:id/reactivate
   * Reativar usuário
   */
  static reactivate = catchAsync(async (req, res) => {
    const { id } = req.params;

    const useCase = userContainer.getReactivateUserUseCase();
    const result = await useCase.execute(id, req.user.id);

    return res.status(200).json({
      status: 'success',
      message: result.message,
    });
  });

  /**
   * GET /api/v1/users/me/profile
   * Obter perfil do próprio usuário
   */
  static getProfile = catchAsync(async (req, res) => {
    const useCase = userContainer.getGetProfileUseCase();
    const profile = await useCase.execute(req.user.id);

    const response = UserPresenter.toProfileResponse(
      profile,
      profile.mustChangePassword
    );

    return res.status(200).json({
      status: 'success',
      data: response,
    });
  });

  /**
 * PATCH /api/v1/users/profile/change-password
 * Alterar a própria senha via perfil
 */
  static changeOwnPassword = catchAsync(async (req, res) => {
    const changePasswordDTO = ChangeOwnPasswordDTO.validate(req.body);

    const useCase = userContainer.getChangeOwnPasswordUseCase();
    const result = await useCase.execute(req.user.id, changePasswordDTO);

    return res.status(200).json({
      status: 'success',
      message: result.message,
    });
  });
}

module.exports = UserController;