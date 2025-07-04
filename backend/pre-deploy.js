// backend/scripts/pre-deploy.js
// Script de pre-deploy pour Render avec vérifications

const { exec } = require('child_process');
const { Sequelize } = require('sequelize');

console.log('🚀 Démarrage du script pre-deploy SpotBulle IA...');

// Fonction pour exécuter une commande
const execCommand = (command) => {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject({ error, stderr });
      } else {
        resolve(stdout);
      }
    });
  });
};

// Fonction pour tester la connexion DB
const testDatabaseConnection = async () => {
  console.log('🔍 Test de connexion à la base de données...');
  
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL non définie');
  }
  
  const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  });
  
  try {
    await sequelize.authenticate();
    console.log('✅ Connexion à la base de données réussie');
    await sequelize.close();
  } catch (error) {
    console.error('❌ Erreur de connexion à la base de données:', error.message);
    throw error;
  }
};

// Fonction pour exécuter les migrations
const runMigrations = async () => {
  console.log('🔄 Exécution des migrations Sequelize...');
  
  try {
    const output = await execCommand('npx sequelize-cli db:migrate');
    console.log('✅ Migrations exécutées avec succès');
    console.log(output);
  } catch (error) {
    console.error('❌ Erreur lors des migrations:', error.error?.message || error.stderr);
    throw error;
  }
};

// Fonction pour vérifier le statut des migrations
const checkMigrationStatus = async () => {
  console.log('📊 Vérification du statut des migrations...');
  
  try {
    const output = await execCommand('npx sequelize-cli db:migrate:status');
    console.log('📋 Statut des migrations:');
    console.log(output);
  } catch (error) {
    console.warn('⚠️ Impossible de vérifier le statut des migrations:', error.stderr);
  }
};

// Script principal
const main = async () => {
  try {
    // 1. Tester la connexion DB
    await testDatabaseConnection();
    
    // 2. Exécuter les migrations
    await runMigrations();
    
    // 3. Vérifier le statut
    await checkMigrationStatus();
    
    console.log('🎉 Pre-deploy terminé avec succès!');
    process.exit(0);
    
  } catch (error) {
    console.error('💥 Erreur critique dans le pre-deploy:', error.message);
    process.exit(1);
  }
};

// Exécuter le script
main();

