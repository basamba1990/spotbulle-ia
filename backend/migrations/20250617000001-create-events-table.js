'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Créer les types ENUM si ils n'existent pas
    const enumThematiqueExists = await queryInterface.sequelize.query(
      "SELECT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_evenements_thematique') AS exists;"
    );
    if (!enumThematiqueExists[0][0].exists) {
      await queryInterface.sequelize.query(`
        CREATE TYPE "enum_evenements_thematique" AS ENUM (
          'sport', 'culture', 'education', 'famille', 'professionnel', 
          'loisirs', 'voyage', 'cuisine', 'technologie', 'sante', 'autre'
        );
      `);
    }

    const enumStatutExists = await queryInterface.sequelize.query(
      "SELECT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_evenements_statut') AS exists;"
    );
    if (!enumStatutExists[0][0].exists) {
      await queryInterface.sequelize.query(`
        CREATE TYPE "enum_evenements_statut" AS ENUM (
          'planifie', 'en_cours', 'termine', 'annule'
        );
      `);
    }

    await queryInterface.createTable('evenements', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      nom: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      date_debut: {
        type: Sequelize.DATE,
        allowNull: false
      },
      date_fin: {
        type: Sequelize.DATE,
        allowNull: true
      },
      lieu: {
        type: Sequelize.STRING,
        allowNull: true
      },
      organisateur_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      thematique: {
        type: Sequelize.ENUM(
          'sport', 'culture', 'education', 'famille', 'professionnel',
          'loisirs', 'voyage', 'cuisine', 'technologie', 'sante', 'autre'
        ),
        allowNull: false,
        defaultValue: 'autre'
      },
      statut: {
        type: Sequelize.ENUM('planifie', 'en_cours', 'termine', 'annule'),
        allowNull: false,
        defaultValue: 'planifie'
      },
      image_url: {
        type: Sequelize.STRING,
        allowNull: true
      },
      capacite_max: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      prix: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0.00
      },
      tags: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: true,
        defaultValue: []
      },
      coordonnees: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      parametres: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: {
          public: true,
          inscription_requise: false,
          moderation_videos: true
        }
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
      }
    });

    // Ajouter des index
    await queryInterface.addIndex('evenements', ['thematique']);
    await queryInterface.addIndex('evenements', ['date_debut']);
    await queryInterface.addIndex('evenements', ['organisateur_id']);
    await queryInterface.addIndex('evenements', ['statut']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('evenements');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_evenements_thematique";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_evenements_statut";');
  }
};

