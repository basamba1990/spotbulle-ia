const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Video = sequelize.define('Video', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
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
      'sport',
      'culture',
      'education',
      'famille',
      'professionnel',
      'loisirs',
      'voyage',
      'cuisine',
      'technologie',
      'sante',
      'autre'
    ),
    allowNull: false,
    defaultValue: 'autre'
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
    comment: 'Durée en secondes'
  },
  taille: {
    type: DataTypes.BIGINT,
    allowNull: true,
    comment: 'Taille en octets'
  },
  date_upload: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  statut: {
    type: DataTypes.ENUM('en_traitement', 'actif', 'inactif', 'supprime', 'modere'),
    defaultValue: 'en_traitement'
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
    comment: 'Métadonnées techniques et personnalisées'
  },
  parametres_confidentialite: {
    type: DataTypes.JSONB,
    defaultValue: {
      public: true,
      commentaires_autorises: true,
      telechargement_autorise: false
    }
  }
}, {
  tableName: 'videos',
  timestamps: true,
  createdAt: 'date_upload',
  updatedAt: 'date_modification',
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['thematique']
    },
    {
      fields: ['statut']
    },
    {
      fields: ['date_upload']
    },
    {
      fields: ['tags'],
      using: 'gin'
    }
  ]
});

module.exports = Video;

