const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/db-production.js");
const Event = require("./Event"); // Importez le modèle Event
const Participation = require("./Participation"); // Importez le modèle Participation
const User = require("./User"); // Importez le modèle User

const Video = sequelize.define("Video", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: "users",
      key: "id"
    }
  },
  titre: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [3, 200]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
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
      "cuisine",
      "technologie",
      "sante",
      "autre"
    ),
    allowNull: false,
    defaultValue: "autre"
  },
  url_video: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isUrl: true
    }
  },
  url_thumbnail: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isUrl: true
    }
  },
  duree: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: "Durée en secondes"
  },
  taille: {
    type: DataTypes.BIGINT,
    allowNull: true,
    comment: "Taille en octets"
  },
  date_upload: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  statut: {
    type: DataTypes.ENUM("en_traitement", "actif", "inactif", "supprime", "modere"),
    defaultValue: "en_traitement"
  },
  transcription: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  format: {
    type: DataTypes.STRING,
    allowNull: true
  },
  resolution: {
    type: DataTypes.STRING,
    allowNull: true
  },
  fps: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  vues: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  likes: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  tags: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  metadonnees: {
    type: DataTypes.JSONB,
    defaultValue: {},
    comment: "Métadonnées techniques et personnalisées"
  },
  parametres_confidentialite: {
    type: DataTypes.JSONB,
    defaultValue: {
      public: true,
      commentaires_autorises: true,
      telechargement_autorise: false
    }
  },
  // Nouveaux champs pour l\'IA
  mots_cles_ia: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: [],
    comment: "Mots-clés extraits par l\'agent IA avec leurs scores de pertinence"
  },
  embedding_vector: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: "Vecteur d\'embedding du contenu de la vidéo pour la recherche de similarité"
  },
  analyse_ia_status: {
    type: DataTypes.ENUM("en_attente", "en_cours", "complete", "echec"),
    allowNull: false,
    defaultValue: "en_attente",
    comment: "Statut de l\'analyse IA de la vidéo"
  },
  resume_ia: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: "Résumé automatique généré par l\'IA"
  },
  entites_nommees: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: [],
    comment: "Entités nommées extraites par l\'IA (personnes, organisations, lieux, etc.)"
  },
  score_qualite_pitch: {
    type: DataTypes.FLOAT,
    allowNull: true,
    comment: "Score de qualité du pitch évalué par l\'IA (0-1)"
  },
  date_analyse_ia: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: "Date de la dernière analyse IA"
  },
  // Colonnes pour les événements et participations
  evenement_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: "events",
      key: "id"
    },
    comment: "ID de l\'événement associé à cette vidéo"
  },
  participation_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: "participations",
      key: "id"
    },
    comment: "ID de la participation associée à cette vidéo"
  }
}, {
  tableName: "videos",
  timestamps: true,
  createdAt: "date_upload",
  updatedAt: "date_modification",
  indexes: [
    {
      fields: ["user_id"]
    },
    {
      fields: ["thematique"]
    },
    {
      fields: ["statut"]
    },
    {
      fields: ["date_upload"]
    },
    {
      fields: ["tags"],
      using: "gin"
    },
    {
      fields: ["analyse_ia_status"]
    }
  ]
});

// Définition des associations après la définition des modèles
Video.belongsTo(Event, { foreignKey: 'evenement_id', as: 'evenement' });
Video.belongsTo(Participation, { foreignKey: 'participation_id', as: 'participation' });
Video.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

module.exports = Video;


