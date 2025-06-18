'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Créer les types ENUM pour participations
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_participations_statut" AS ENUM (
        'inscrit', 'confirme', 'present', 'absent', 'annule'
      );
    `);

    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_participations_role" AS ENUM (
        'participant', 'organisateur', 'moderateur', 'invite'
      );
    `);

    await queryInterface.createTable('participations', {
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
      evenement_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'evenements',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      video_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'videos',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      date_participation: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      statut: {
        type: Sequelize.ENUM('inscrit', 'confirme', 'present', 'absent', 'annule'),
        allowNull: false,
        defaultValue: 'inscrit'
      },
      role: {
        type: Sequelize.ENUM('participant', 'organisateur', 'moderateur', 'invite'),
        allowNull: false,
        defaultValue: 'participant'
      },
      commentaire: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      note: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      date_inscription: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      date_modification: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      metadonnees: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: {}
      }
    });

    // Ajouter des index
    await queryInterface.addIndex('participations', ['user_id']);
    await queryInterface.addIndex('participations', ['evenement_id']);
    await queryInterface.addIndex('participations', ['video_id']);
    await queryInterface.addIndex('participations', ['statut']);
    
    // Contrainte unique pour éviter les participations en double
    await queryInterface.addConstraint('participations', {
      fields: ['user_id', 'evenement_id'],
      type: 'unique',
      name: 'unique_user_event_participation'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('participations');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_participations_statut";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_participations_role";');
  }
};

