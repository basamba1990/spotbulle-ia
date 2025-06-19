'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
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
        type: Sequelize.STRING,
        allowNull: false
      },
      prenom: {
        type: Sequelize.STRING,
        allowNull: false
      },
      bio: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      avatar_url: {
        type: Sequelize.STRING,
        allowNull: true
      },
      date_creation: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      date_modification: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      preferences: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: {
          notifications: true,
          public_profile: true,
          theme: 'light'
        }
      },
      statut: {
        type: Sequelize.ENUM('actif', 'inactif', 'suspendu'),
        allowNull: false,
        defaultValue: 'actif'
      },
      derniere_connexion: {
        type: Sequelize.DATE,
        allowNull: true
      },
      // AJOUT DU CHAMP ROLE
      role: {
        type: Sequelize.STRING,
        defaultValue: 'user', // Valeur par défaut
        allowNull: false
      }
    });

    // Ajouter des index pour améliorer les performances
    await queryInterface.addIndex('users', ['email']);
    await queryInterface.addIndex('users', ['statut']);
    await queryInterface.addIndex('users', ['role']); // Nouvel index pour le rôle
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('users');
  }
};
