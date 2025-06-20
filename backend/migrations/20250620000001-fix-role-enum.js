'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Migration pour corriger l'enum existant si nécessaire
    
    // 1. Vérifier si l'enum existe déjà et le supprimer si nécessaire
    await queryInterface.sequelize.query(`
      DO $$ 
      BEGIN
        -- Supprimer la colonne role si elle existe avec un mauvais enum
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'role') THEN
          ALTER TABLE users DROP COLUMN role;
        END IF;
        
        -- Supprimer l'ancien enum s'il existe
        DROP TYPE IF EXISTS enum_users_role;
        
        -- Créer le nouvel enum avec les bonnes valeurs
        CREATE TYPE enum_users_role AS ENUM ('utilisateur', 'administrateur', 'moderateur');
      END $$;
    `);

    // 2. Ajouter la colonne role avec le bon enum
    await queryInterface.addColumn('users', 'role', {
      type: Sequelize.ENUM('utilisateur', 'administrateur', 'moderateur'),
      allowNull: false,
      defaultValue: 'utilisateur'
    });

    // 3. Ajouter un index pour améliorer les performances
    await queryInterface.addIndex('users', ['role']);
  },

  down: async (queryInterface, Sequelize) => {
    // Supprimer l'index
    await queryInterface.removeIndex('users', ['role']);
    
    // Supprimer la colonne 'role'
    await queryInterface.removeColumn('users', 'role');
    
    // Supprimer l'ENUM type
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_users_role";');
  }
};

