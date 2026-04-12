/**
 * USE CASE: Update Profile
 * Atualizar perfil do próprio usuário
 * ✅ Permite atualizar: name, cpf, e todos os campos de endereço
 */

const AppError = require('../../../shared/utils/AppError');
const CacheService = require('../../../infrastructure/services/CacheService');
const logger = require('../../../infrastructure/config/logger');

class UpdateProfileUseCase {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async execute(userId, updateProfileDTO) {
    // ✅ 1. Buscar usuário
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new AppError('Usuário não encontrado.', 404);
    }

    // ✅ 2. Atualizar a instância da entidade (Lógica de Domínio)
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

    // ✅ 3. Mapear dinamicamente apenas os campos fornecidos no DTO para persistência
    const updateData = {};
    const profileFields = [
      'name', 'cpf', 'address_street', 'address_number', 'address_complement',
      'address_neighborhood', 'address_city', 'address_state', 'address_zip'
    ];

    profileFields.forEach(field => {
      if (updateProfileDTO[field] !== undefined) {
        // Usamos o valor que passou pela entidade para garantir que regras de domínio foram aplicadas
        updateData[field] = user[field];
      }
    });

    // ✅ 4. Persistir no banco de dados
    const updatedUser = await this.userRepository.update(userId, updateData);

    // ✅ 5. Invalidação de Cache
    await this._invalidateCache(userId);

    logger.info({ userId }, 'Usuário atualizou o próprio perfil com sucesso.');

    return updatedUser;
  }

  async _invalidateCache(userId) {
    await CacheService.del(`users:${userId}`);
    // Importante: Se o perfil mudar, a lista de usuários (cache do admin) também pode estar defasada
    await CacheService.delPattern('users:list:*');
  }
}

module.exports = UpdateProfileUseCase;