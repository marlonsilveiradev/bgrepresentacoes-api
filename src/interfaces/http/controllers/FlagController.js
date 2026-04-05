/**
 * CONTROLLER: FlagController
 */

const catchAsync = require('../../../shared/utils/catchAsync');
const { flagContainer } = require('../../../infrastructure/container');
const { FlagPresenter } = require('../../../application/presenters/flag');
const {
  ListFlagsQueryDTO,
  CreateFlagDTO,
  UpdateFlagDTO,
} = require('../../../application/dtos/flag');

class FlagController {
  /**
   * GET /api/v1/flags
   */
  static list = catchAsync(async (req, res) => {
    const { page, limit, is_active, search } = req.query;

    const queryDTO = new ListFlagsQueryDTO({
      page,
      limit,
      is_active,
      search,
    });

    const useCase = flagContainer.getListFlagsUseCase();
    const result = await useCase.execute(queryDTO);

    const response = FlagPresenter.toListWithPagination(result);

    return res.status(200).json({
      status: 'success',
      data: response.data,
      pagination: response.pagination,
    });
  });

  /**
   * GET /api/v1/flags/:id
   */
  static getById = catchAsync(async (req, res) => {
    const { id } = req.params;

    const useCase = flagContainer.getGetFlagByIdUseCase();
    const flag = await useCase.execute(id);

    const response = FlagPresenter.toResponse(flag);

    return res.status(200).json({
      status: 'success',
      data: response,
    });
  });

  /**
   * POST /api/v1/flags
   */
  static create = catchAsync(async (req, res) => {
    const createDTO = new CreateFlagDTO(req.body);

    const useCase = flagContainer.getCreateFlagUseCase();
    const flag = await useCase.execute(createDTO);

    const response = FlagPresenter.toResponse(flag);

    return res.status(201).json({
      status: 'success',
      message: 'Bandeira criada com sucesso.',
      data: response,
    });
  });

  /**
   * PATCH /api/v1/flags/:id
   */
  static update = catchAsync(async (req, res) => {
    const { id } = req.params;
    const updateDTO = new UpdateFlagDTO(req.body);

    const useCase = flagContainer.getUpdateFlagUseCase();
    const flag = await useCase.execute(id, updateDTO);

    const response = FlagPresenter.toResponse(flag);

    return res.status(200).json({
      status: 'success',
      message: 'Bandeira atualizada com sucesso.',
      data: response,
    });
  });

  /**
   * PATCH /api/v1/flags/:id/deactivate
   */
  static deactivate = catchAsync(async (req, res) => {
    const { id } = req.params;

    const useCase = flagContainer.getDeactivateFlagUseCase();
    const result = await useCase.execute(id);

    return res.status(200).json({
      status: 'success',
      message: result.message,
    });
  });

  /**
   * PATCH /api/v1/flags/:id/reactivate
   */
  static reactivate = catchAsync(async (req, res) => {
    const { id } = req.params;

    const useCase = flagContainer.getReactivateFlagUseCase();
    const result = await useCase.execute(id);

    return res.status(200).json({
      status: 'success',
      message: result.message,
    });
  });
}

module.exports = FlagController;