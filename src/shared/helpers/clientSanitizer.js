const { getAllowedFields } = require('./clientPermissions');

const sanitizeClientData = (data, role) => {
  const allowedFields = getAllowedFields(role);

  const sanitized = {};

  for (const key of Object.keys(data)) {
    if (allowedFields.includes(key)) {
      sanitized[key] = data[key];
    }
  }

  return sanitized;
};

module.exports = { sanitizeClientData };