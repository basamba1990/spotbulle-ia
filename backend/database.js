const { Sequelize } = require("sequelize");
require("dotenv").config();

// Configuration de la base de données avec gestion d'erreurs améliorée
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: "postgres",
  logging: process.env.NODE_ENV === "development" ? console.log : false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  dialectOptions: {
    ssl: process.env.NODE_ENV === "production"
      ? {
          require: true,
          rejectUnauthorized: false,
        }
      : {
          require: true,
          rejectUnauthorized: false,
        },
  },
  retry: {
    match: [
      /ECONNRESET/,
      /ENOTFOUND/,
      /ECONNREFUSED/,
      /ETIMEDOUT/,
      /EHOSTUNREACH/,
    ],
    max: 3,
  },
});

const connectDB = async () => {
  try {
    console.log("🔄 Tentative de connexion à la base de données...");

    // Vérifier que DATABASE_URL est définie
    if (!process.env.DATABASE_URL) {
      throw new Error(
        "DATABASE_URL n'est pas définie dans les variables d'environnement"
      );
    }

    await sequelize.authenticate();
    console.log("✅ Connexion à la base de données établie avec succès");

    // Synchroniser les modèles en développement uniquement
    if (process.env.NODE_ENV === "development") {
      await sequelize.sync({ alter: true });
      console.log("✅ Modèles synchronisés avec la base de données");
    } else {
      // En production, juste vérifier la connexion
      console.log("✅ Base de données prête pour la production");
    }
  } catch (error) {
    console.error("❌ Erreur de connexion à la base de données:", error.message);
    console.error("📋 Détails de l'erreur:", error);

    // En production, on peut essayer de continuer sans DB pour les endpoints de santé
    if (process.env.NODE_ENV === "production") {
      console.log("⚠️ Démarrage en mode dégradé sans base de données");
      return;
    }

    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };

