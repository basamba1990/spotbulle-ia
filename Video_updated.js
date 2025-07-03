const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const Event = require("./Event"); // Importez le modèle Event
const Participation = require("./Participation"); // Importez le modèle Participation
const User = require("./User"); // Importez le modèle User

const Video = sequelize.define("Video", {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: "users",
            key: "id",
        },
    },
    titre: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            len: [3, 200],
        },
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    thematique: {
        type: DataTypes.ENUM(
            "sport",
            "culture",
            "education",
            "famille",
            "professionnel",
            "loisirs",
            "voyage",
            "technologie",
            "art",
            "musique",
            "cuisine",
            "mode",
            "science",
            "histoire",
            "nature",
            "gaming",
            "automobile",
            "finance",
            "sante",
            "bien-etre",
            "humour",
            "actualite",
            "documentaire",
            "autre"
        ),
        allowNull: false,
        defaultValue: "autre"
    },
    url_video: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            isUrl: true,
        },
    },
    thumbnail_url: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
            isUrl: true,
        },
    },
    duree: {
        type: DataTypes.INTEGER, // Durée en secondes
        allowNull: true,
    },
    vues: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    date_upload: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
    // Champs pour l'analyse IA
    transcription: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    mots_cles: {
        type: DataTypes.JSON, // Stockera un tableau de chaînes JSONifié
        allowNull: true,
    },
    resume: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    embedding_vector: {
        type: DataTypes.JSON, // Stockera un tableau de nombres JSONifié
        allowNull: true,
    },
    analyse_ia_status: {
        type: DataTypes.ENUM("pending", "en_cours", "complete", "echec"),
        defaultValue: "pending",
        allowNull: false,
    },
}, {
    tableName: "videos",
    timestamps: true,
    underscored: true,
});

// Associations
Video.belongsTo(User, { foreignKey: "user_id", as: "user" });
Video.hasMany(Participation, { foreignKey: "video_id", as: "participations" });
Video.hasMany(Event, { foreignKey: "video_id", as: "events" });

module.exports = Video;


