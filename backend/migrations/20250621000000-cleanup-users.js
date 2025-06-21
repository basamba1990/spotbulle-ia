'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('users', null, {});
  },

  down: async (queryInterface, Sequelize) => {
    // Pas de rollback pour cette migration
    console.log('Impossible de restaurer les utilisateurs supprimés');
  }
};
