'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('users', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      password_hash: {
        type: Sequelize.STRING,
        allowNull: false
      },
      nom: {
        type: Sequelize.STRING
      },
      prenom: {
        type: Sequelize.STRING
      },
      bio: {
        type: Sequelize.TEXT
      },
      avatar_url: {
        type: Sequelize.STRING
      },
      date_creation: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      preferences: {
        type: Sequelize.JSONB // Ou TEXT si vous stockez des chaînes JSON simples
      },
      statut: {
        type: Sequelize.STRING,
        defaultValue: 'actif' // Ajout de la valeur par défaut
      },
      derniere_connexion: {
        type: Sequelize.DATE
      },
      date_modification: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      createdAt: { // Colonne ajoutée par Sequelize pour l'horodatage de création
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: { // Colonne ajoutée par Sequelize pour l'horodatage de dernière mise à jour
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('users');
  }
};
