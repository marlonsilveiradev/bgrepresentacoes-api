/**
 * CONTAINER: User Dependencies
 * Injeção de dependências centralizada
 */

const { UserRepository } = require('../repositories');
const {
  ListUsersUseCase,
  GetUserByIdUseCase,
  CreateUserUseCase,
  UpdateUserUseCase,
  UpdateProfileUseCase,
  DeactivateUserUseCase,
  ReactivateUserUseCase,
  GetProfileUseCase,
  ChangeOwnPasswordUseCase,
} = require('../../application/use-cases/user');

class UserContainer {
  constructor() {
    // Repository (singleton)
    this.userRepository = new UserRepository();

    // Use Cases (singleton)
    this.listUsersUseCase = new ListUsersUseCase(this.userRepository);
    this.getUserByIdUseCase = new GetUserByIdUseCase(this.userRepository);
    this.createUserUseCase = new CreateUserUseCase(this.userRepository);
    this.updateUserUseCase = new UpdateUserUseCase(this.userRepository);
    this.updateProfileUseCase = new UpdateProfileUseCase(this.userRepository);
    this.deactivateUserUseCase = new DeactivateUserUseCase(this.userRepository);
    this.reactivateUserUseCase = new ReactivateUserUseCase(this.userRepository);
    this.getProfileUseCase = new GetProfileUseCase(this.userRepository);
    this.changeOwnPasswordUseCase = new ChangeOwnPasswordUseCase(this.userRepository)
  }

  getListUsersUseCase() {
    return this.listUsersUseCase;
  }

  getGetUserByIdUseCase() {
    return this.getUserByIdUseCase;
  }

  getCreateUserUseCase() {
    return this.createUserUseCase;
  }

  getUpdateUserUseCase() {
    return this.updateUserUseCase;
  }

  getUpdateProfileUseCase() {
    return this.updateProfileUseCase;
  }

  getDeactivateUserUseCase() {
    return this.deactivateUserUseCase;
  }

  getReactivateUserUseCase() {
    return this.reactivateUserUseCase;
  }

  getGetProfileUseCase() {
    return this.getProfileUseCase;
  }

  getChangeOwnPasswordUseCase() {
  return this.changeOwnPasswordUseCase;
}
}

module.exports = new UserContainer();