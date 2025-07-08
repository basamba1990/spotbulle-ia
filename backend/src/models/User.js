const { DataTypes } = require("sequelize");
const { sequelize } = require("../config");
const bcrypt = require("bcryptjs"); // CHANGEMENT ICI

const User = sequelize.define("User", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password_hash: {
    type: DataTypes.STRING,
    allowNull: false
  },
  nom: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [2, 50]
    }
  },
  prenom: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [2, 50]
    }
  },
  bio: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  avatar_url: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isUrl: true
    }
  },
  date_creation: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  preferences: {
    type: DataTypes.JSONB,
    defaultValue: {
      notifications: true,
      public_profile: true,
      theme: "light"
    }
  },
  statut: {
    type: DataTypes.ENUM("actif", "inactif", "suspendu"),
    defaultValue: "actif"
  },
  derniere_connexion: {
    type: DataTypes.DATE,
    allowNull: true
  },
  role: {
    type: DataTypes.ENUM("utilisateur", "administrateur", "moderateur"),
    defaultValue: "utilisateur"
  }
}, {
  tableName: "users",
  timestamps: true,
  createdAt: "date_creation",
  updatedAt: "date_modification",
  hooks: {
    beforeCreate: async (user) => {
      if (user.password_hash) {
        const salt = await bcrypt.genSalt(12);
        user.password_hash = await bcrypt.hash(user.password_hash, salt);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed("password_hash")) {
        const salt = await bcrypt.genSalt(12);
        user.password_hash = await bcrypt.hash(user.password_hash, salt);
      }
    }
  }
});

// Méthode pour vérifier le mot de passe
User.prototype.verifyPassword = async function(password) {
  return await bcrypt.compare(password, this.password_hash);
};

// Méthode pour obtenir les données publiques de l'utilisateur
User.prototype.getPublicData = function() {
  const { password_hash, ...publicData } = this.toJSON();
  return publicData;
};

module.exports = User;


