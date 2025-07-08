const { DataTypes } = require('sequelize');
const { sequelize } = require("../config");

const Event = sequelize.define('Event', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  nom: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [3, 100]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  date_debut: {
    type: DataTypes.DATE,
    allowNull: false
  },
  date_fin: {
    type: DataTypes.DATE,
    allowNull: true,
    validate: {
      isAfterStart(value) {
        if (value && this.date_debut && value < this.date_debut) {
          throw new Error('La date de fin doit être après la date de début');
        }
      }
    }
  },
  lieu: {
    type: DataTypes.STRING,
    allowNull: true
  },
  organisateur_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
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
  statut: {
    type: DataTypes.ENUM('planifie', 'en_cours', 'termine', 'annule'),
    defaultValue: 'planifie'
  },
  image_url: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isUrl: true
    }
  },
  capacite_max: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1
    }
  },
  prix: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0.00
  },
  tags: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  coordonnees: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: 'Coordonnées GPS: {lat: number, lng: number}'
  },
  parametres: {
    type: DataTypes.JSONB,
    defaultValue: {
      public: true,
      inscription_requise: false,
      moderation_videos: true
    }
  }
}, {
  tableName: 'evenements',
  timestamps: true,
  createdAt: 'date_creation',
  updatedAt: 'date_modification',
  indexes: [
    {
      fields: ['thematique']
    },
    {
      fields: ['date_debut']
    },
    {
      fields: ['organisateur_id']
    },
    {
      fields: ['statut']
    }
  ]
});

module.exports = Event;

