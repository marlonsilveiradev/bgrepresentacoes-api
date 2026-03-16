const { Client } = require('../models');
const { Op } = require('sequelize');

const generateProtocol = async () => {
  const now   = new Date();
  const year  = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day   = String(now.getDate()).padStart(2, '0');
  const prefix = `${year}${month}${day}`;

  const startOfDay = new Date(now.setHours(0, 0, 0, 0));
  const endOfDay   = new Date(now.setHours(23, 59, 59, 999));

  const count = await Client.count({
    where: {
      protocol:   { [Op.like]: `${prefix}%` },
      created_at: { [Op.between]: [startOfDay, endOfDay] },
    },
    paranoid: false,
  });

  return `${prefix}${String(count + 1).padStart(4, '0')}`;
};

module.exports = { generateProtocol };