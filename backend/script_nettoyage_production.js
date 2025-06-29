// script_nettoyage_production.js
// Script pour nettoyer SpotBulle IA et le préparer pour la production

const { Sequelize, Op } = require('sequelize');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Configuration de la base de données
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false, // Désactiver les logs SQL pour plus de clarté
  dialectOptions: {
    ssl: process.env.NODE_ENV === 'production' ? {
      require: true,
      rejectUnauthorized: false
    } : false
  }
});

// Couleurs pour l'affichage console
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  title: (msg) => console.log(`${colors.cyan}🚀 ${msg}${colors.reset}`)
};

/**
 * Fonction principale de nettoyage pour la production
 */
async function preparerProduction() {
  try {
    log.title('Préparation de SpotBulle IA pour la production');
    console.log('='.repeat(50));
    
    // Connexion à la base de données
    await sequelize.authenticate();
    log.success('Connexion à la base de données établie');

    // Créer une sauvegarde avant nettoyage
    await creerSauvegarde();

    // Nettoyer les données de test
    const stats = await nettoyerDonneesTest();

    // Optimiser la base de données
    await optimiserBaseDonnees();

    // Vérifier l'intégrité des données
    await verifierIntegrite();

    // Afficher le résumé
    afficherResume(stats);

    log.success('Préparation pour la production terminée !');
    
  } catch (error) {
    log.error(`Erreur lors de la préparation: ${error.message}`);
    throw error;
  } finally {
    await sequelize.close();
  }
}

/**
 * Créer une sauvegarde complète avant nettoyage
 */
async function creerSauvegarde() {
  log.info('Création d\'une sauvegarde complète...');
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = `backup_production_${timestamp}.json`;
  
  try {
    // Récupérer toutes les données
    const [users, events, videos, participations] = await Promise.all([
      sequelize.query('SELECT * FROM users', { type: Sequelize.QueryTypes.SELECT }),
      sequelize.query('SELECT * FROM events', { type: Sequelize.QueryTypes.SELECT }),
      sequelize.query('SELECT * FROM videos', { type: Sequelize.QueryTypes.SELECT }),
      sequelize.query('SELECT * FROM participations', { type: Sequelize.QueryTypes.SELECT })
    ]);
    
    const backup = {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      tables: {
        users: users,
        events: events,
        videos: videos,
        participations: participations
      },
      stats: {
        totalUsers: users.length,
        totalEvents: events.length,
        totalVideos: videos.length,
        totalParticipations: participations.length
      }
    };
    
    fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));
    log.success(`Sauvegarde créée: ${backupFile}`);
    
  } catch (error) {
    log.error(`Erreur lors de la sauvegarde: ${error.message}`);
    throw error;
  }
}

/**
 * Nettoyer toutes les données de test et démonstration
 */
async function nettoyerDonneesTest() {
  log.info('Nettoyage des données de test et démonstration...');
  
  const stats = {
    videosSupprimes: 0,
    evenementsSupprimes: 0,
    utilisateursSupprimes: 0,
    participationsSupprimes: 0
  };

  try {
    // 1. Nettoyer les vidéos de test
    log.info('Suppression des vidéos de test...');
    const videosTest = await sequelize.query(`
      DELETE FROM videos 
      WHERE 
        titre ILIKE ANY(ARRAY['%videoplayback%', '%video1%', '%test%', '%demo%', '%sample%'])
        OR description ILIKE ANY(ARRAY['%test%', '%demo%', '%exemple%'])
        OR url_fichier ILIKE ANY(ARRAY['%test%', '%demo%', '%sample%'])
      RETURNING id
    `, { type: Sequelize.QueryTypes.DELETE });
    
    stats.videosSupprimes = videosTest.length;
    log.success(`${stats.videosSupprimes} vidéos de test supprimées`);

    // 2. Nettoyer les événements de test
    log.info('Suppression des événements de test...');
    const evenementsTest = await sequelize.query(`
      DELETE FROM events 
      WHERE 
        titre ILIKE ANY(ARRAY['%Concert de Jazz%', '%Festival d''été%', '%test%', '%demo%'])
        OR description ILIKE ANY(ARRAY['%test%', '%demo%', '%exemple%'])
        OR lieu ILIKE ANY(ARRAY['%test%', '%demo%'])
      RETURNING id
    `, { type: Sequelize.QueryTypes.DELETE });
    
    stats.evenementsSupprimes = evenementsTest.length;
    log.success(`${stats.evenementsSupprimes} événements de test supprimés`);

    // 3. Nettoyer les utilisateurs de test (ATTENTION: très sélectif)
    log.info('Suppression des utilisateurs de test...');
    const utilisateursTest = await sequelize.query(`
      DELETE FROM users 
      WHERE 
        email ILIKE ANY(ARRAY['%test%', '%demo%', '%example%', '%fake%'])
        AND email NOT ILIKE '%@gmail.com'
        AND email NOT ILIKE '%@yahoo.fr'
        AND email NOT ILIKE '%@outlook.com'
      RETURNING id
    `, { type: Sequelize.QueryTypes.DELETE });
    
    stats.utilisateursSupprimes = utilisateursTest.length;
    log.success(`${stats.utilisateursSupprimes} utilisateurs de test supprimés`);

    // 4. Nettoyer les participations orphelines
    log.info('Suppression des participations orphelines...');
    const participationsOrphelines = await sequelize.query(`
      DELETE FROM participations 
      WHERE 
        user_id NOT IN (SELECT id FROM users)
        OR evenement_id NOT IN (SELECT id FROM events)
      RETURNING id
    `, { type: Sequelize.QueryTypes.DELETE });
    
    stats.participationsSupprimes = participationsOrphelines.length;
    log.success(`${stats.participationsSupprimes} participations orphelines supprimées`);

    // 5. Nettoyer les données d'analyse IA incomplètes
    log.info('Nettoyage des analyses IA incomplètes...');
    await sequelize.query(`
      UPDATE videos 
      SET 
        analyse_ia_status = 'en_attente',
        analyse_ia_transcription = NULL,
        analyse_ia_resume = NULL,
        analyse_ia_mots_cles = NULL,
        analyse_ia_entites = NULL,
        analyse_ia_score = NULL,
        analyse_ia_recommandations = NULL
      WHERE 
        analyse_ia_status = 'echec'
        OR (analyse_ia_status = 'en_cours' AND updated_at < NOW() - INTERVAL '1 hour')
    `);
    
    log.success('Analyses IA incomplètes nettoyées');

    return stats;
    
  } catch (error) {
    log.error(`Erreur lors du nettoyage: ${error.message}`);
    throw error;
  }
}

/**
 * Optimiser la base de données
 */
async function optimiserBaseDonnees() {
  log.info('Optimisation de la base de données...');
  
  try {
    // Créer les index manquants pour améliorer les performances
    const indexes = [
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_videos_user_id ON videos(user_id)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_videos_date_upload ON videos(date_upload)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_videos_analyse_status ON videos(analyse_ia_status)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_date_debut ON events(date_debut)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_statut ON events(statut)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_organisateur ON events(organisateur_id)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_participations_user_event ON participations(user_id, evenement_id)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email ON users(email)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_created_at ON users(created_at)'
    ];

    for (const indexQuery of indexes) {
      try {
        await sequelize.query(indexQuery);
      } catch (error) {
        // Ignorer si l'index existe déjà
        if (!error.message.includes('already exists')) {
          log.warning(`Erreur création index: ${error.message}`);
        }
      }
    }

    // Analyser les tables pour mettre à jour les statistiques
    await sequelize.query('ANALYZE users, events, videos, participations');
    
    log.success('Base de données optimisée');
    
  } catch (error) {
    log.error(`Erreur lors de l'optimisation: ${error.message}`);
    throw error;
  }
}

/**
 * Vérifier l'intégrité des données
 */
async function verifierIntegrite() {
  log.info('Vérification de l\'intégrité des données...');
  
  try {
    // Vérifier les contraintes de clés étrangères
    const checks = [
      {
        name: 'Vidéos avec utilisateur inexistant',
        query: 'SELECT COUNT(*) as count FROM videos WHERE user_id NOT IN (SELECT id FROM users)'
      },
      {
        name: 'Événements avec organisateur inexistant',
        query: 'SELECT COUNT(*) as count FROM events WHERE organisateur_id NOT IN (SELECT id FROM users)'
      },
      {
        name: 'Participations avec utilisateur inexistant',
        query: 'SELECT COUNT(*) as count FROM participations WHERE user_id NOT IN (SELECT id FROM users)'
      },
      {
        name: 'Participations avec événement inexistant',
        query: 'SELECT COUNT(*) as count FROM participations WHERE evenement_id NOT IN (SELECT id FROM events)'
      }
    ];

    let integrite = true;
    for (const check of checks) {
      const result = await sequelize.query(check.query, { type: Sequelize.QueryTypes.SELECT });
      const count = parseInt(result[0].count);
      
      if (count > 0) {
        log.warning(`${check.name}: ${count} enregistrements problématiques`);
        integrite = false;
      }
    }

    if (integrite) {
      log.success('Intégrité des données vérifiée');
    } else {
      log.warning('Problèmes d\'intégrité détectés - correction recommandée');
    }
    
  } catch (error) {
    log.error(`Erreur lors de la vérification: ${error.message}`);
    throw error;
  }
}

/**
 * Afficher le résumé des statistiques
 */
async function afficherResume(stats) {
  log.info('Génération du résumé...');
  
  try {
    // Statistiques finales
    const [users, events, videos, participations] = await Promise.all([
      sequelize.query('SELECT COUNT(*) as count FROM users', { type: Sequelize.QueryTypes.SELECT }),
      sequelize.query('SELECT COUNT(*) as count FROM events', { type: Sequelize.QueryTypes.SELECT }),
      sequelize.query('SELECT COUNT(*) as count FROM videos', { type: Sequelize.QueryTypes.SELECT }),
      sequelize.query('SELECT COUNT(*) as count FROM participations', { type: Sequelize.QueryTypes.SELECT })
    ]);

    console.log('\n' + '='.repeat(50));
    log.title('RÉSUMÉ DE LA PRÉPARATION PRODUCTION');
    console.log('='.repeat(50));
    
    console.log('\n📊 NETTOYAGE EFFECTUÉ:');
    console.log(`   Vidéos supprimées: ${stats.videosSupprimes}`);
    console.log(`   Événements supprimés: ${stats.evenementsSupprimes}`);
    console.log(`   Utilisateurs supprimés: ${stats.utilisateursSupprimes}`);
    console.log(`   Participations supprimées: ${stats.participationsSupprimes}`);
    
    console.log('\n📈 DONNÉES RESTANTES:');
    console.log(`   Utilisateurs: ${users[0].count}`);
    console.log(`   Événements: ${events[0].count}`);
    console.log(`   Vidéos: ${videos[0].count}`);
    console.log(`   Participations: ${participations[0].count}`);
    
    console.log('\n✅ OPTIMISATIONS APPLIQUÉES:');
    console.log('   Index de performance créés');
    console.log('   Statistiques de base de données mises à jour');
    console.log('   Analyses IA incomplètes nettoyées');
    
    console.log('\n🎯 PROCHAINES ÉTAPES:');
    console.log('   1. Vérifier que l\'application fonctionne correctement');
    console.log('   2. Tester les fonctionnalités principales');
    console.log('   3. Configurer le monitoring en production');
    console.log('   4. Planifier les sauvegardes régulières');
    
    console.log('\n' + '='.repeat(50));
    
  } catch (error) {
    log.error(`Erreur lors du résumé: ${error.message}`);
  }
}

/**
 * Fonction pour restaurer depuis une sauvegarde
 */
async function restaurerSauvegarde(fichierSauvegarde) {
  try {
    log.info(`Restauration depuis ${fichierSauvegarde}...`);
    
    if (!fs.existsSync(fichierSauvegarde)) {
      throw new Error(`Fichier de sauvegarde non trouvé: ${fichierSauvegarde}`);
    }
    
    const backup = JSON.parse(fs.readFileSync(fichierSauvegarde, 'utf8'));
    
    // Vider les tables dans l'ordre correct (contraintes FK)
    await sequelize.query('TRUNCATE TABLE participations CASCADE');
    await sequelize.query('TRUNCATE TABLE videos CASCADE');
    await sequelize.query('TRUNCATE TABLE events CASCADE');
    await sequelize.query('TRUNCATE TABLE users CASCADE');
    
    // Restaurer les données
    for (const [table, data] of Object.entries(backup.tables)) {
      if (data.length > 0) {
        const columns = Object.keys(data[0]).join(', ');
        const values = data.map(row => 
          '(' + Object.values(row).map(val => 
            val === null ? 'NULL' : `'${val.toString().replace(/'/g, "''")}'`
          ).join(', ') + ')'
        ).join(', ');
        
        await sequelize.query(`INSERT INTO ${table} (${columns}) VALUES ${values}`);
        log.success(`Table ${table} restaurée (${data.length} enregistrements)`);
      }
    }
    
    log.success('Restauration terminée');
    
  } catch (error) {
    log.error(`Erreur lors de la restauration: ${error.message}`);
    throw error;
  }
}

// Gestion des arguments de ligne de commande
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--help')) {
    console.log(`
Usage: node script_nettoyage_production.js [options]

Options:
  --restore <fichier>     Restaurer depuis une sauvegarde
  --help                  Afficher cette aide
  
Par défaut: Préparer l'application pour la production
    `);
  } else if (args.includes('--restore') && args[1]) {
    restaurerSauvegarde(args[1]);
  } else {
    preparerProduction();
  }
}

module.exports = {
  preparerProduction,
  restaurerSauvegarde
};

