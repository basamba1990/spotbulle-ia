
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("videos", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      titre: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
      },
      url: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      miniature_url: {
        type: Sequelize.STRING,
      },
      duree: {
        type: Sequelize.INTEGER, // Durée en secondes
      },
      statut: {
        type: Sequelize.ENUM("actif", "inactif", "en_attente", "supprime"),
        defaultValue: "en_attente",
        allowNull: false,
      },
      parametres_confidentialite: {
        type: Sequelize.JSONB, // Pour stocker des objets JSON comme { public: true, partages_avec: [] }
        defaultValue: { public: true },
        allowNull: false,
      },
      vues: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false,
      },
      likes: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false,
      },
      dislikes: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.INTEGER,
        references: {
          model: "users", // Nom de la table des utilisateurs
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
        allowNull: true, // Ou false si une vidéo doit toujours avoir un utilisateur
      },
      evenement_id: {
        type: Sequelize.INTEGER,
        references: {
          model: "events", // Nom de la table des événements
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
        allowNull: true,
      },
      participation_id: {
        type: Sequelize.INTEGER,
        references: {
          model: "participations", // Nom de la table des participations
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
        allowNull: true,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("videos");
  },
};


