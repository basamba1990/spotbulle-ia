'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Créer les types ENUM pour videos
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_videos_thematique" AS ENUM (
        'sport', 'culture', 'education', 'famille', 'professionnel', 
        'loisirs', 'voyage', 'cuisine', 'technologie', 'sante', 'autre'
      );
    `);

    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_videos_statut" AS ENUM (
        'en_traitement', 'actif', 'inactif', 'supprime', 'modere'
      );
    `);

    await queryInterface.createTable('videos', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      titre: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      thematique: {
        type: Sequelize.ENUM(
          'sport', 'culture', 'education', 'famille', 'professionnel',
          'loisirs', 'voyage', 'cuisine', 'technologie', 'sante', 'autre'
        ),
        allowNull: false,
        defaultValue: 'autre'
      },
      url_video: {
        type: Sequelize.STRING,
        allowNull: false
      },
      url_thumbnail: {
        type: Sequelize.STRING,
        allowNull: true
      },
      duree: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      taille: {
        type: Sequelize.BIGINT,
        allowNull: true
      },
      date_upload: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      date_modification: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      statut: {
        type: Sequelize.ENUM('en_traitement', 'actif', 'inactif', 'supprime', 'modere'),
        allowNull: false,
        defaultValue: 'en_traitement'
      },
      transcription: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      format: {
        type: Sequelize.STRING,
        allowNull: true
      },
      resolution: {
        type: Sequelize.STRING,
        allowNull: true
      },
      fps: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      vues: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      likes: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      tags: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: true,
        defaultValue: []
      },
      metadonnees: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: {}
      },
      parametres_confidentialite: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: {
          public: true,
          commentaires_autorises: true,
          telechargement_autorise: false
        }
      }
    });

    // Ajouter des index
    await queryInterface.addIndex('videos', ['user_id']);
    await queryInterface.addIndex('videos', ['thematique']);
    await queryInterface.addIndex('videos', ['statut']);
    await queryInterface.addIndex('videos', ['date_upload']);
    await queryInterface.addIndex('videos', ['tags'], { using: 'gin' });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('videos');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_videos_thematique";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_videos_statut";');
  }
};

