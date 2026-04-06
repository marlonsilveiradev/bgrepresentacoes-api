/**
 * PRESENTER: UserPresenter
 * Transforma User (entidade) para JSON (HTTP response)
 */

const { UserResponseDTO } = require('../../dtos/user');

class UserPresenter {
  static toResponse(user) {
    return new UserResponseDTO(user);
  }

  static toListResponse(users) {
    return UserResponseDTO.toList(users);
  }

  static toListWithPagination(result) {
    return {
      data: this.toListResponse(result.data),
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    };
  }

  static toCreateResponse(user, temporaryPassword) {
    return {
      user: new UserResponseDTO(user),
      temporaryPassword,
    };
  }

  static toDeactivateResponse(message) {
    return { message };
  }

  static toReactivateResponse(message) {
    return { message };
  }

  static toProfileResponse(user, mustChangePassword) {
    return {
      ...new UserResponseDTO(user),
      mustChangePassword,
    };
  }
}

module.exports = UserPresenter;