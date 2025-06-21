// backend/config/config.js
require(\'dotenv\').config(); // Nécessaire pour charger les variables d\'environnement si vous testez en local

module.exports = {
  development: {
    // Utilisez l\'URL de la base de données pour le développement.
    // Vous pouvez la définir directement ici ou via une variable d\'environnement locale.
    url: process.env.DATABASE_URL || \'postgresql://spotbulle_ia_db_deoi_user:sHwvy4I5c530CeBYFHlAyuPgJQI4x2r6@dpg-d191qhbuibrs73bo0ut0-a.frankfurt-postgres.render.com/spotbulle_ia_db_deoi\',
    dialect: \'postgres\',
    logging: console.log, // Active les logs en développement pour voir ce que fait Sequelize
  },
  test: {
    // Configuration pour l\'environnement de test.
    url: process.env.DATABASE_URL_TEST || \'postgresql://user:password@localhost:5432/your_test_db\',
    dialect: \'postgres\',
    logging: false,
  },
  production: {
    // Configuration pour l\'environnement de production sur Render.
    // Sequelize utilisera la variable d\'environnement DATABASE_URL définie sur Render.
    url: process.env.DATABASE_URL,
    dialect: \'postgres\',
    dialectOptions: {
      ssl: {
        require: true, // Exige une connexion SSL
        rejectUnauthorized: false // Accepte les certificats auto-signés (nécessaire pour Render/Supabase)
      }
    },
    logging: false, // Désactive les logs en production pour des raisons de performance et de sécurité
  }
};


