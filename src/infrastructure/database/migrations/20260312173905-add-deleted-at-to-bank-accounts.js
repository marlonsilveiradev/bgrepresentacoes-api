'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('client_bank_accounts', 'deleted_at', {
  type: Sequelize.DATE,
  allowNull: true,
});
  },

  async down (queryInterface, Sequelize) {
  await queryInterface.removeColumn(
    'client_bank_accounts',
    'deleted_at'
  );
}
};
