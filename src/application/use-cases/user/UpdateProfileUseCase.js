/**
 * USE CASE: Update Profile
 * Atualizar perfil do próprio usuário
 * ✅ Permite atualizar: name, cpf, e todos os campos de endereço
 */

const CacheService = require('../../../infrastructure/services/CacheService');
const logger = require('../../../infrastructure/config/logger');

class UpdateProfileUseCase {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async execute(userId, updateProfileDTO) {
    // ✅ Buscar usuário
    const user = await this.userRepository.findById(userId);

    // ✅ Atualizar perfil (regra do domínio)
    user.updateProfile({
      name: updateProfileDTO.name,
      cpf: updateProfileDTO.cpf,
      address_street: updateProfileDTO.address_street,
      address_number: updateProfileDTO.address_number,
      address_complement: updateProfileDTO.address_complement,
      address_neighborhood: updateProfileDTO.address_neighborhood,
      address_city: updateProfileDTO.address_city,
      address_state: updateProfileDTO.address_state,
      address_zip: updateProfileDTO.address_zip,
    });

    // ✅ Persistir apenas os campos que mudaram
    const updateData = {};
    if (updateProfileDTO.name !== undefined) updateData.name = user.name;
    if (updateProfileDTO.cpf !== undefined) updateData.cpf = user.cpf;
    if (updateProfileDTO.address_street !== undefined) updateData.address_street = user.address_street;
    if (updateProfileDTO.address_number !== undefined) updateData.address_number = user.address_number;
    if (updateProfileDTO.address_complement !== undefined) updateData.address_complement = user.address_complement;
    if (updateProfileDTO.address_neighborhood !== undefined) updateData.address_neighborhood = user.address_neighborhood;
    if (updateProfileDTO.address_city !== undefined) updateData.address_city = user.address_city;
    if (updateProfileDTO.address_state !== undefined) updateData.address_state = user.address_state;
    if (updateProfileDTO.address_zip !== undefined) updateData.address_zip = user.address_zip;

    const updated = await this.userRepository.update(userId, updateData);

    // ✅ Limpar cache
    await this._invalidateCache(userId);

    logger.info({ userId }, 'Usuário atualizou o próprio perfil.');

    return updated;
  }

  async _invalidateCache(userId) {
    await CacheService.del(`users:${userId}`);
  }
}

module.exports = UpdateProfileUseCase;