/**
 * USE CASE: Create User
 * Cria usuário com senha temporária
 */

const { v4: uuid } = require('uuid');
const User = require('../../../domain/entities/User');
const TemporaryPassword = require('../../../domain/value-objects/TemporaryPassword');
const AppError = require('../../../shared/utils/AppError');
const CacheService = require('../../../infrastructure/services/CacheService');
const logger = require('../../../infrastructure/config/logger');

class CreateUserUseCase {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async execute(createUserDTO) {
    // ✅ REGRA 1: Verificar se email já existe
    const emailInUse = await this.userRepository.isEmailInUse(createUserDTO.email);
    if (emailInUse) {
      throw new AppError('E-mail já está em uso.', 409);
    }

    // ✅ REGRA 2: Criar entidade User (valida automaticamente)
    const user = new User({
      id: uuid(),
      name: createUserDTO.name,
      email: createUserDTO.email,
      role: createUserDTO.role,
      is_active: true,
      last_login_at: null,
      created_at: new Date(),
      updated_at: new Date(),
    });

    // ✅ REGRA 3: Gerar senha temporária (Value Object)
    const temporaryPassword = TemporaryPassword.generate();

    // ✅ REGRA 4: Persistir no repositório
    const savedUser = await this.userRepository.create(user, temporaryPassword.toString());

    // ✅ Limpar cache de lista
    await this._invalidateListCache();

    logger.info(
      { userId: savedUser.id, role: savedUser.role },
      'Usuário criado com senha temporária.'
    );

    return {
      user: savedUser,
      temporaryPassword: temporaryPassword.toString(),
    };
  }

  async _invalidateListCache() {
    await CacheService.delPattern('users:list:*');
  }
}

module.exports = CreateUserUseCase;