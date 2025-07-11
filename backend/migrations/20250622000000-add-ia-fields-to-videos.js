'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('videos', 'mots_cles_ia', {
      type: Sequelize.JSONB,
      allowNull: true,
      defaultValue: [],
      comment: 'Mots-clés extraits par l\'agent IA avec leurs scores de pertinence'
    });

    await queryInterface.addColumn('videos', 'embedding_vector', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'Vecteur d\'embedding du contenu de la vidéo pour la recherche de similarité'
    });

    await queryInterface.addColumn('videos', 'analyse_ia_status', {
      type: Sequelize.ENUM('en_attente', 'en_cours', 'complete', 'echec'),
      allowNull: false,
      defaultValue: 'en_attente',
      comment: 'Statut de l\'analyse IA de la vidéo'
    });

    await queryInterface.addColumn('videos', 'resume_ia', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'Résumé automatique généré par l\'IA'
    });

    await queryInterface.addColumn('videos', 'entites_nommees', {
      type: Sequelize.JSONB,
      allowNull: true,
      defaultValue: [],
      comment: 'Entités nommées extraites par l\'IA (personnes, organisations, lieux, etc.)'
    });

    await queryInterface.addColumn('videos', 'score_qualite_pitch', {
      type: Sequelize.FLOAT,
      allowNull: true,
      comment: 'Score de qualité du pitch évalué par l\'IA (0-1)'
    });

    await queryInterface.addColumn('videos', 'date_analyse_ia', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'Date de la dernière analyse IA'
    });

    // Ajouter un index pour la recherche par statut d'analyse IA
    await queryInterface.addIndex('videos', ['analyse_ia_status']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('videos', ['analyse_ia_status']);
    await queryInterface.removeColumn('videos', 'date_analyse_ia');
    await queryInterface.removeColumn('videos', 'score_qualite_pitch');
    await queryInterface.removeColumn('videos', 'entites_nommees');
    await queryInterface.removeColumn('videos', 'resume_ia');
    await queryInterface.removeColumn('videos', 'analyse_ia_status');
    await queryInterface.removeColumn('videos', 'embedding_vector');
    await queryInterface.removeColumn('videos', 'mots_cles_ia');
  }
};

