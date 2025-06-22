'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('videos', 'transcription_ia', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'Transcription générée par IA'
    });

    await queryInterface.addColumn('videos', 'mots_cles_ia', {
      type: Sequelize.ARRAY(Sequelize.STRING),
      defaultValue: [],
      comment: 'Mots-clés extraits par IA'
    });

    await queryInterface.addColumn('videos', 'score_pitch', {
      type: Sequelize.FLOAT,
      allowNull: true,
      comment: 'Score de qualité du pitch (0-100)'
    });

    await queryInterface.addColumn('videos', 'analyse_sentiment', {
      type: Sequelize.JSONB,
      defaultValue: {},
      comment: 'Analyse de sentiment (positif, négatif, neutre)'
    });

    await queryInterface.addColumn('videos', 'projets_correspondants', {
      type: Sequelize.ARRAY(Sequelize.UUID),
      defaultValue: [],
      comment: 'IDs des vidéos/projets similaires'
    });

    await queryInterface.addColumn('videos', 'statut_analyse_ia', {
      type: Sequelize.ENUM('en_attente', 'en_cours', 'termine', 'erreur'),
      defaultValue: 'en_attente',
      comment: 'Statut de l\'analyse IA'
    });

    await queryInterface.addColumn('videos', 'date_analyse_ia', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'Date de la dernière analyse IA'
    });

    // Ajouter des index pour optimiser les performances
    await queryInterface.addIndex('videos', ['mots_cles_ia'], {
      using: 'gin'
    });

    await queryInterface.addIndex('videos', ['statut_analyse_ia']);
  },

  down: async (queryInterface, Sequelize) => {
    // Supprimer les index
    await queryInterface.removeIndex('videos', ['mots_cles_ia']);
    await queryInterface.removeIndex('videos', ['statut_analyse_ia']);

    // Supprimer les colonnes
    await queryInterface.removeColumn('videos', 'transcription_ia');
    await queryInterface.removeColumn('videos', 'mots_cles_ia');
    await queryInterface.removeColumn('videos', 'score_pitch');
    await queryInterface.removeColumn('videos', 'analyse_sentiment');
    await queryInterface.removeColumn('videos', 'projets_correspondants');
    await queryInterface.removeColumn('videos', 'statut_analyse_ia');
    await queryInterface.removeColumn('videos', 'date_analyse_ia');

    // Supprimer l'enum
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_videos_statut_analyse_ia";');
  }
};

