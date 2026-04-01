const { ROLES } = require('../constants/roles');

function buildClientAccessFilter(user) {
  if (!user) {
    return { id: null };
  }

  switch (user.role) {
    case ROLES.ADMIN:
      return {};

    case ROLES.PARTNER:
      return { userId: user.id };

    default:
      return { id: null };
  }
}

module.exports = {
  buildClientAccessFilter,
};