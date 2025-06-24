'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('videos', 'evenement_id', {
      type: Sequelize.UUID,
      allowNull: true
    });

    await queryInterface.addColumn('videos', 'participation_id', {
      type: Sequelize.UUID,
      allowNull: true
    });

    // Ajouter des index pour améliorer les performances
    await queryInterface.addIndex('videos', ['evenement_id']);
    await queryInterface.addIndex('videos', ['participation_id']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('videos', ['participation_id']);
    await queryInterface.removeIndex('videos', ['evenement_id']);
    await queryInterface.removeColumn('videos', 'participation_id');
    await queryInterface.removeColumn('videos', 'evenement_id');
  }
};

