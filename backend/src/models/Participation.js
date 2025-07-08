const { DataTypes } = require('sequelize');
const { sequelize } = require("../../config");

const Participation = sequelize.define('Participation', {
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
  evenement_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'evenements',
      key: 'id'
    }
  },
  video_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'videos',
      key: 'id'
    }
  },
  date_participation: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  statut: {
    type: DataTypes.ENUM('inscrit', 'confirme', 'present', 'absent', 'annule'),
    defaultValue: 'inscrit'
  },
  role: {
    type: DataTypes.ENUM('participant', 'organisateur', 'moderateur', 'invite'),
    defaultValue: 'participant'
  },
  commentaire: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  note: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1,
      max: 5
    }
  },
  date_inscription: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  metadonnees: {
    type: DataTypes.JSONB,
    defaultValue: {},
    comment: 'Données supplémentaires sur la participation'
  }
}, {
  tableName: 'participations',
  timestamps: true,
  createdAt: 'date_inscription',
  updatedAt: 'date_modification',
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['evenement_id']
    },
    {
      fields: ['video_id']
    },
    {
      fields: ['statut']
    },
    {
      unique: true,
      fields: ['user_id', 'evenement_id'],
      name: 'unique_user_event_participation'
    }
  ]
});

module.exports = Participation;

