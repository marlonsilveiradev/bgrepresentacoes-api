const { ROLES } = require('../constants/roles');

const ALLOWED_FIELDS_BY_ROLE = {
  [ROLES.ADMIN]: [
    'trade_name',
    'phone',
    'notes',
    'benefit_type',
    'overall_status',
    'partner_id',
  ],
  [ROLES.USER]: [
    'trade_name',
    'phone',
    'notes',
  ],
  [ROLES.PARTNER]: [], // não edita nada
};

const getAllowedFields = (role) => {
  return ALLOWED_FIELDS_BY_ROLE[role] || [];
};

module.exports = { getAllowedFields };