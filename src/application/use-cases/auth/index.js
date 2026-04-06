/**
 * Auth Use Cases - Índice centralizado
 */

const LoginUseCase = require('./LoginUseCase');
const ChangePasswordUseCase = require('./ChangePasswordUseCase');
const RefreshAccessTokenUseCase = require('./RefreshAccessTokenUseCase');

module.exports = {
  LoginUseCase,
  ChangePasswordUseCase,
  RefreshAccessTokenUseCase,
};