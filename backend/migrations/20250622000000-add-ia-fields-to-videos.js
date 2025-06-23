'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('videos');

    // Liste des colonnes à ajouter avec leur configuration
    const columnsToAdd = {
      mots_cles_ia: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: [],
        comment: 'Mots-clés extraits par l\'agent IA avec leurs scores de pertinence'
      },
      embedding_vector: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Vecteur d\'embedding du contenu de la vidéo pour la recherche de similarité'
      },
      analyse_ia_status: {
        type: Sequelize.ENUM('en_attente', 'en_cours', 'complete', 'echec'),
        allowNull: false,
        defaultValue: 'en_attente',
        comment: 'Statut de l\'analyse IA de la vidéo'
      },
      resume_ia: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Résumé automatique généré par l\'IA'
      },
      entites_nommees: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: [],
        comment: 'Entités nommées extraites par l\'IA (personnes, organisations, lieux, etc.)'
      },
      score_qualite_pitch: {
        type: Sequelize.FLOAT,
        allowNull: true,
        comment: 'Score de qualité du pitch évalué par l\'IA (0-1)'
      },
      date_analyse_ia: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Date de la dernière analyse IA'
      }
    };

    // Ajouter chaque colonne si elle n'existe pas
    for (const columnName of Object.keys(columnsToAdd)) {
      if (!table[columnName]) {
        await queryInterface.addColumn('videos', columnName, columnsToAdd[columnName]);
      }
    }

    // Vérifier et ajouter l'index si nécessaire
    const indexes = await queryInterface.showIndex('videos');
    const indexExists = indexes.some(index => 
      index.fields.includes('analyse_ia_status') && 
      index.primary === false
    );
    if (!indexExists) {
      await queryInterface.addIndex('videos', ['analyse_ia_status']);
    }
  },

  async down(queryInterface, Sequelize) {
    // Ici, on pourrait enlever les colonnes, mais c'est optionnel car on ne revient pas en arrière d'une migration corrective.
    // On peut laisser vide ou implémenter un down si nécessaire.
    // Pour l'instant, on ne fait rien car c'est une migration corrective.
  }
};
