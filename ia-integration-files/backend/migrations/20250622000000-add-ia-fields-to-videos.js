module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.addColumn("videos", "transcription", {
            type: Sequelize.TEXT,
            allowNull: true,
        });
        await queryInterface.addColumn("videos", "mots_cles", {
            type: Sequelize.JSON,
            allowNull: true,
        });
        await queryInterface.addColumn("videos", "resume", {
            type: Sequelize.TEXT,
            allowNull: true,
        });
        await queryInterface.addColumn("videos", "embedding_vector", {
            type: Sequelize.JSON,
            allowNull: true,
        });
        await queryInterface.addColumn("videos", "analyse_ia_status", {
            type: Sequelize.ENUM("pending", "en_cours", "complete", "echec"),
            defaultValue: "pending",
            allowNull: false,
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeColumn("videos", "transcription");
        await queryInterface.removeColumn("videos", "mots_cles");
        await queryInterface.removeColumn("videos", "resume");
        await queryInterface.removeColumn("videos", "embedding_vector");
        await queryInterface.removeColumn("videos", "analyse_ia_status");
    },
};


