const { ROLES } = require('../constants/roles');

function buildClientAccessFilter(user, extraFilters = {}) {
  if (!user) {
    return { id: null };
  }

  let baseFilter = {};

  switch (user.role) {
    case ROLES.ADMIN:
      baseFilter = {};
      break;

    case ROLES.PARTNER:
      baseFilter = { partner_id: user.id };
      break;

    case ROLES.USER:
      baseFilter = { created_by: user.id };
      break;

    default:
      return { id: null };
  }

  return {
    ...baseFilter,
    ...extraFilters,
  };
}

module.exports = {
  buildClientAccessFilter,
};