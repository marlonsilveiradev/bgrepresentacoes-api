'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {

    const plans = await queryInterface.sequelize.query(
      `SELECT id, name FROM plans`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    const flags = await queryInterface.sequelize.query(
      `SELECT id, name FROM flags`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    const combo5 = plans.find(p => p.name === 'Combo 5 Bandeiras');
    const combo7 = plans.find(p => p.name === 'Combo 7 Bandeiras');

    const relations = [];

    flags.slice(0,5).forEach(flag => {
      relations.push({
        id: Sequelize.literal('gen_random_uuid()'),
        plan_id: combo5.id,
        flag_id: flag.id,
        created_at: new Date(),
        updated_at: new Date()
      });
    });

    flags.slice(0,7).forEach(flag => {
      relations.push({
        id: Sequelize.literal('gen_random_uuid()'),
        plan_id: combo7.id,
        flag_id: flag.id,
        created_at: new Date(),
        updated_at: new Date()
      });
    });

    await queryInterface.bulkInsert('plan_flags', relations);

  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('plan_flags', null, {});
  }
};