/**
 * USE CASE: Get Profile
 * Obter perfil do próprio usuário
 */

const AppError = require('../../../shared/utils/AppError');

class GetProfileUseCase {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async execute(userId) {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new AppError('Usuário não encontrado.', 404);
    }

    return {
      ...user.toJSON(),
      mustChangePassword: user.isFirstLogin(),
    };
  }
}

module.exports = GetProfileUseCase;