/**
 * PRESENTER: Flag Presenter
 */

const { FlagResponseDTO } = require('../../dtos/flag');

class FlagPresenter {
  static toResponse(flag) {
    return new FlagResponseDTO(flag);
  }

  static toListResponse(flags) {
    return FlagResponseDTO.toList(flags);
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
}

module.exports = FlagPresenter;