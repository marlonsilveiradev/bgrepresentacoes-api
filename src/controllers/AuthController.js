const AuthService = require('../services/AuthService');
const catchAsync = require('../utils/catchAsync');
const { RefreshToken } = require('../models');
const { hashToken } = require('../utils/tokenHash');

/**
 * Controller de Autenticação.
 * Responsabilidade: HTTP only — recebe, delega ao Service, responde.
 */

// ─── POST /api/v1/auth/login ──────────────────────────────────────────────────
const login = catchAsync(async (req, res) => {
  const result = await AuthService.login(req.body.email, req.body.password);

  return res.status(200).json({
    status: 'success',
    message: result.mustChangePassword
      ? 'Primeiro acesso detectado. Troca de senha obrigatória.'
      : 'Login realizado com sucesso.',
    data: result,
  });
});

// ─── PATCH /api/v1/auth/change-password ──────────────────────────────────────
const changePassword = catchAsync(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id; // injetado pelo authMiddleware

  const result = await AuthService.changePassword(userId, currentPassword, newPassword);

  return res.status(200).json({
    status: 'success',
    data: result
  });
});

// ─── POST /api/v1/auth/refresh ────────────────────────────────────────────────
const refresh = catchAsync(async (req, res) => {
  const { refreshToken } = req.body;

  const result = await AuthService.refreshAccessToken(refreshToken);

  return res.status(200).json({
    status: 'success',
    message: 'Token renovado com sucesso.',
    data: result,
  });
});

// ─── POST /api/v1/auth/logout ────────────────────────────────────────────────
const logout = catchAsync(async (req, res) => {
  const { refreshToken } = req.body;

  if (refreshToken) {
    const hashed = hashToken(refreshToken);

    await RefreshToken.update(
      { revoked: true },
      { where: { token_hash: hashed } }
    );
  }

  return res.status(200).json({
    status: 'success',
    message: 'Logout realizado com sucesso.',
  });
});

module.exports = { login, changePassword, refresh, logout };