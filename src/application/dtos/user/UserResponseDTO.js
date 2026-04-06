/**
 * DTO: User Response
 * Formato de resposta HTTP
 */

class UserResponseDTO {
  constructor(user) {
    this.id = user.id;
    this.name = user.name;
    this.email = user.email;
    this.role = user.role;
    this.is_active = user.is_active;
    this.last_login_at = user.last_login_at
      ? new Date(user.last_login_at).toISOString()
      : null;
    this.created_at = user.created_at
      ? new Date(user.created_at).toISOString()
      : null;
    this.updated_at = user.updated_at
      ? new Date(user.updated_at).toISOString()
      : null;
  }

  static toList(users) {
    return users.map(user => new UserResponseDTO(user));
  }
}

module.exports = UserResponseDTO;