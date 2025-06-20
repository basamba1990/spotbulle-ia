'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Ajouter la colonne 'role' à la table users
    await queryInterface.addColumn('users', 'role', {
      type: Sequelize.ENUM('utilisateur', 'administrateur', 'moderateur'),
      allowNull: false,
      defaultValue: 'utilisateur'
    });

    // Ajouter un index pour améliorer les performances
    await queryInterface.addIndex('users', ['role']);
  },

  down: async (queryInterface, Sequelize) => {
    // Supprimer l'index
    await queryInterface.removeIndex('users', ['role']);
    
    // Supprimer la colonne 'role'
    await queryInterface.removeColumn('users', 'role');
    
    // Supprimer l'ENUM type (optionnel, selon la configuration)
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_users_role";');
  }
};

