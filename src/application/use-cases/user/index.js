/**
 * User Use Cases - Índice centralizado
 */

const ListUsersUseCase = require('./ListUsersUseCase');
const GetUserByIdUseCase = require('./GetUserByIdUseCase');
const CreateUserUseCase = require('./CreateUserUseCase');
const UpdateUserUseCase = require('./UpdateUserUseCase');
const UpdateProfileUseCase = require('./UpdateProfileUseCase');
const DeactivateUserUseCase = require('./DeactivateUserUseCase');
const ReactivateUserUseCase = require('./ReactivateUserUseCase');
const GetProfileUseCase = require('./GetProfileUseCase');
const ChangeOwnPasswordUseCase = require('./ChangeOwnPasswordUseCase')

module.exports = {
  ListUsersUseCase,
  GetUserByIdUseCase,
  CreateUserUseCase,
  UpdateUserUseCase,
  UpdateProfileUseCase,
  DeactivateUserUseCase,
  ReactivateUserUseCase,
  GetProfileUseCase,
  ChangeOwnPasswordUseCase,
};