/**
 * CONTROLLER: AuthController
 * Responsabilidade: APENAS HTTP
 */

const catchAsync = require('../../../shared/utils/catchAsync');
const { authContainer } = require('../../../infrastructure/container');
const { AuthPresenter } = require('../../../application/presenters/auth');
const {
  LoginDTO,
  ChangePasswordDTO,
  RefreshTokenDTO,
} = require('../../../application/dtos/auth');

class AuthController {
  /**
   * POST /api/v1/auth/login
   * Fazer login
   */
  static login = catchAsync(async (req, res) => {
    // ✅ PASSO 1: Validar entrada (Yup middleware já fez)
    const loginDTO = LoginDTO.validate(req.body);

    // ✅ PASSO 2: Executar use case
    const useCase = authContainer.getLoginUseCase();
    const result = await useCase.execute(loginDTO);

    // ✅ PASSO 3: Usar presenter para formatar
    const response = AuthPresenter.toLoginResponse(
      result.user,
      result.token,
      result.refreshToken,
      result.mustChangePassword
    );

    // ✅ PASSO 4: Retornar HTTP
    return res.status(200).json({
      status: 'success',
      message: result.mustChangePassword
        ? 'Primeiro login. Altere sua senha.'
        : 'Login realizado com sucesso.',
      data: response,
    });
  });

  /**
   * POST /api/v1/auth/change-password
   * Alterar senha
   */
  static changePassword = catchAsync(async (req, res) => {
    // ✅ Validar entrada
    const changePasswordDTO = ChangePasswordDTO.validate(req.body);

    // ✅ Executar use case
    const useCase = authContainer.getChangePasswordUseCase();
    const result = await useCase.execute(req.user.id, changePasswordDTO);

    // ✅ Formatar resposta
    const response = AuthPresenter.toChangePasswordResponse(result.message);

    // ✅ Retornar HTTP
    return res.status(200).json({
      status: 'success',
      data: response,
    });
  });

  /**
   * POST /api/v1/auth/refresh-token
   * Renovar token de acesso
   */
  static refresh = catchAsync(async (req, res) => {
    // ✅ Validar entrada
    const refreshTokenDTO = RefreshTokenDTO.validate(req.body);

    // ✅ Executar use case
    const useCase = authContainer.getRefreshAccessTokenUseCase();
    const result = await useCase.execute(refreshTokenDTO);

    // ✅ Formatar resposta
    const response = AuthPresenter.toRefreshResponse(
      result.token,
      result.refreshToken
    );

    // ✅ Retornar HTTP
    return res.status(200).json({
      status: 'success',
      message: 'Token renovado com sucesso',
      data: response,
    });
  });

   /**
   * POST /api/v1/auth/logout
   * Fazer logout (revogar todos os refresh tokens)
   */
  static logout = catchAsync(async (req, res) => {
    const userId = req.user.id;

    // ✅ Revogar todos os tokens do usuário
    const refreshTokenRepository = authContainer.getRefreshTokenRepository();
    await refreshTokenRepository.revokeAllForUser(userId);

    // ✅ Log
    const logger = require('../../../infrastructure/config/logger');
    logger.info({ userId }, 'Logout realizado com sucesso');

    // ✅ Retornar HTTP
    return res.status(200).json({
      status: 'success',
      message: 'Logout realizado com sucesso.',
    });
  });
}

module.exports = AuthController;