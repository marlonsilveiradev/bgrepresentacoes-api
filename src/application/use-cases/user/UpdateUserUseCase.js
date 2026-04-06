/**
 * USE CASE: Update User
 * Atualizar usuário por admin
 * ✅ Permite atualizar: email, role, is_active
 * ⚠️ Para atualizar name/cpf/endereço, admin usa endpoint de perfil também
 */

const AppError = require('../../../shared/utils/AppError');
const CacheService = require('../../../infrastructure/services/CacheService');
const logger = require('../../../infrastructure/config/logger');

class UpdateUserUseCase {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async execute(targetId, requesterId, updateUserDTO) {
    // ✅ REGRA 1: Buscar usuário alvo
    const user = await this.userRepository.findById(targetId);
    if (!user) {
      throw new AppError('Usuário não encontrado.', 404);
    }

    // ✅ REGRA 2: Validar auto-edição (proteções de self-edit)
    if (targetId === requesterId) {
      if (updateUserDTO.role !== undefined && updateUserDTO.role !== user.role) {
        throw new AppError('Você não pode alterar o próprio papel (role).', 403);
      }

      if (updateUserDTO.is_active === false) {
        throw new AppError('Você não pode desativar a própria conta.', 403);
      }
    }

    // ✅ REGRA 3: Se mudando email, verificar unicidade
    if (updateUserDTO.email && updateUserDTO.email !== user.email) {
      const emailInUse = await this.userRepository.isEmailInUse(
        updateUserDTO.email,
        targetId
      );
      if (emailInUse) {
        throw new AppError('E-mail já está em uso.', 409);
      }
    }

    // ✅ REGRA 4: Atualizar dados
    const updateData = {};
    if (updateUserDTO.email !== undefined) updateData.email = updateUserDTO.email;
    if (updateUserDTO.role !== undefined) updateData.role = updateUserDTO.role;
    if (updateUserDTO.is_active !== undefined) updateData.is_active = updateUserDTO.is_active;

    const updated = await this.userRepository.update(targetId, updateData);

    // ✅ Limpar cache
    await this._invalidateCache(targetId);

    logger.info(
      { targetId, requesterId, changes: Object.keys(updateData) },
      'Usuário atualizado por admin.'
    );

    return updated;
  }

  async _invalidateCache(userId) {
    await CacheService.del(`users:${userId}`);
    await CacheService.delPattern('users:list:*');
  }
}

module.exports = UpdateUserUseCase;