// backend/src/server.js - Version API pure pour déploiement séparé
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { connectDB } = require('./config/db');

// Import des routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const eventRoutes = require('./routes/eventRoutes');
const videoRoutes = require('./routes/videoRoutes');
const analyseIARoutes = require('./routes/analyseIARoutes');

// Import des modèles pour établir les associations
const User = require('./models/User');
const Event = require('./models/Event');
const Video = require('./models/Video');
const Participation = require('./models/Participation');

const app = express();
const PORT = process.env.PORT || 10000;

// Configuration des associations entre modèles
const setupAssociations = () => {
  try {
    // User associations
    User.hasMany(Event, { foreignKey: 'organisateur_id', as: 'evenements_organises' });
    User.hasMany(Video, { foreignKey: 'user_id', as: 'user_videos' });
    User.hasMany(Participation, { foreignKey: 'user_id', as: 'user_participations' });

    // Event associations
    Event.belongsTo(User, { foreignKey: 'organisateur_id', as: 'organisateur' });
    Event.hasMany(Participation, { foreignKey: 'evenement_id', as: 'event_participations' });
    Event.hasMany(Video, { foreignKey: 'evenement_id', as: 'event_videos' });

    // Video associations
    Video.belongsTo(User, { foreignKey: 'user_id', as: 'video_user' });
    Video.belongsTo(Event, { foreignKey: 'evenement_id', as: 'evenement_video' });
    Video.belongsTo(Participation, { foreignKey: 'participation_id', as: 'video_participation_link' });

    // Participation associations
    Participation.belongsTo(User, { foreignKey: 'user_id', as: 'participation_user' });
    Participation.belongsTo(Event, { foreignKey: 'evenement_id', as: 'evenement_lie' });
    Participation.hasMany(Video, { foreignKey: 'participation_id', as: 'participation_videos_link' });
    
    console.log('✅ Associations de modèles configurées avec succès');
  } catch (error) {
    console.error('❌ Erreur lors de la configuration des associations:', error);
  }
};

// Configuration du rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limite de requêtes par IP
  message: {
    error: 'Trop de requêtes depuis cette IP, veuillez réessayer plus tard.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Middlewares de sécurité
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https:"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https:"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "https:", "wss:"],
      fontSrc: ["'self'", "https:", "data:"],
      mediaSrc: ["'self'", "https:", "blob:"],
    },
  },
}));

// Configuration CORS pour déploiement séparé
app.use(cors({
  origin: function (origin, callback) {
    // Permettre les requêtes sans origine (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'https://spotbulle-ia.vercel.app',
      'https://spotbulle-ia-frontend.vercel.app',
      'https://spotbulle-jrxlpa9ha-samba-bas-projects.vercel.app',
      'http://localhost:3000',
      'http://localhost:3001',
      // Ajouter d'autres domaines Vercel si nécessaire
      /^https:\/\/.*\.vercel\.app$/
    ];
    
    // Vérifier si l'origine est dans la liste ou correspond au pattern Vercel
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (typeof allowedOrigin === 'string') {
        return allowedOrigin === origin;
      } else if (allowedOrigin instanceof RegExp) {
        return allowedOrigin.test(origin);
      }
      return false;
    });
    
    if (isAllowed || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      console.log(`⚠️ Origine non autorisée: ${origin}`);
      callback(null, true); // Permettre temporairement pour le debug
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count']
}));

app.use(compression());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(limiter);

// Faire confiance aux en-têtes de proxy
app.set('trust proxy', 1);

// Middlewares pour le parsing avec limite de taille
app.use(express.json({ limit: '250mb' }));
app.use(express.urlencoded({ extended: true, limit: '250mb' }));

// Route de santé pour API pure
app.get("/api/health", async (req, res) => {
  try {
    const healthStatus = {
      status: 'OK',
      message: 'API SpotBulle opérationnelle',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.1.1',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      type: 'API_BACKEND'
    };

    // Test de connexion DB
    try {
      const { sequelize } = require('./config/db');
      await sequelize.authenticate();
      healthStatus.database = 'connected';
    } catch (dbError) {
      healthStatus.database = 'disconnected';
      healthStatus.dbError = dbError.message;
    }

    res.status(200).json(healthStatus);
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: 'Erreur lors de la vérification de santé',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Route de test de base de données
app.get('/api/health/db', async (req, res) => {
  try {
    const { sequelize } = require('./config/db');
    await sequelize.authenticate();
    
    const result = await sequelize.query('SELECT 1 as test');
    
    res.status(200).json({
      status: 'OK',
      message: 'Base de données connectée et fonctionnelle',
      timestamp: new Date().toISOString(),
      testQuery: result[0]
    });
  } catch (error) {
    console.error('❌ Erreur de connexion DB:', error);
    res.status(500).json({
      status: 'ERROR',
      message: 'Erreur de connexion à la base de données',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Routes API avec logging (avec préfixe /api)
app.use('/api/auth', (req, res, next) => {
  console.log(`🔐 Auth request: ${req.method} ${req.path}`);
  next();
}, authRoutes);

app.use('/api/users', (req, res, next) => {
  console.log(`👤 Users request: ${req.method} ${req.path}`);
  next();
}, userRoutes);

app.use('/api/events', (req, res, next) => {
  console.log(`📅 Events request: ${req.method} ${req.path}`);
  next();
}, eventRoutes);

app.use('/api/videos', (req, res, next) => {
  console.log(`🎥 Videos request: ${req.method} ${req.path}`);
  next();
}, videoRoutes);

app.use('/api/ia', (req, res, next) => {
  console.log(`🤖 IA request: ${req.method} ${req.path}`);
  next();
}, analyseIARoutes);

// CORRECTION: Routes sans préfixe /api pour compatibilité frontend
app.use('/auth', (req, res, next) => {
  console.log(`🔐 Auth request (sans API): ${req.method} ${req.path}`);
  next();
}, authRoutes);

app.use('/users', (req, res, next) => {
  console.log(`👤 Users request (sans API): ${req.method} ${req.path}`);
  next();
}, userRoutes);

app.use('/events', (req, res, next) => {
  console.log(`📅 Events request (sans API): ${req.method} ${req.path}`);
  next();
}, eventRoutes);

app.use('/videos', (req, res, next) => {
  console.log(`🎥 Videos request (sans API): ${req.method} ${req.path}`);
  next();
}, videoRoutes);

app.use('/ia', (req, res, next) => {
  console.log(`🤖 IA request (sans API): ${req.method} ${req.path}`);
  next();
}, analyseIARoutes);

// Route API racine
app.get('/api', (req, res) => {
  res.json({
    message: 'API SpotBulle - Plateforme de partage vidéo avec IA',
    version: '1.1.1',
    status: 'operational',
    timestamp: new Date().toISOString(),
    type: 'API_BACKEND',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      users: '/api/users',
      events: '/api/events',
      videos: '/api/videos',
      ia: '/api/ia'
    },
    fonctionnalites_ia: {
      analyse_ia: 'Analyse automatique des pitchs vidéo',
      transcription: 'Transcription audio vers texte',
      mots_cles: 'Extraction automatique de mots-clés',
      similarite: 'Recherche de projets similaires',
      resume: 'Génération automatique de résumés',
      statistiques: 'Statistiques et recommandations personnalisées'
    },
    environment: process.env.NODE_ENV || 'development',
    cors: {
      enabled: true,
      allowedOrigins: 'Vercel domains + localhost'
    }
  });
});

// Route racine pour redirection vers API
app.get('/', (req, res) => {
  res.json({
    message: 'SpotBulle IA - Backend API',
    version: '1.1.1',
    documentation: '/api',
    health: '/api/health',
    frontend: 'Déployé séparément sur Vercel',
    timestamp: new Date().toISOString(),
    note: 'Routes disponibles avec et sans préfixe /api pour compatibilité'
  });
});

// Middleware de gestion d'erreurs
app.use((err, req, res, next) => {
  console.error('❌ Erreur serveur:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });
  
  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      success: false,
      message: 'Fichier trop volumineux. Taille maximale: 250MB'
    });
  }
  
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      success: false,
      message: 'Format JSON invalide'
    });
  }
  
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Erreur interne du serveur' 
      : err.message,
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      details: err
    })
  });
});

// Middleware pour les routes non trouvées
app.use('*', (req, res) => {
  console.log(`❌ Route non trouvée: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: 'Route non trouvée',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
    suggestion: req.originalUrl.startsWith('/api/') 
      ? 'Vérifiez que la route API existe' 
      : `Route disponible avec ou sans préfixe /api`,
    availableRoutes: {
      api: '/api (Documentation)',
      health: '/api/health (Status)',
      auth: '/auth ou /api/auth (POST /login, POST /register, GET /me)',
      videos: '/videos ou /api/videos (GET /, GET /:id, POST /upload)',
      events: '/events ou /api/events (GET /, GET /:id, POST /)',
      users: '/users ou /api/users (GET /profile, PUT /profile)',
      ia: '/ia ou /api/ia (POST /videos/:id/analyser, GET /videos/:id/resultats)'
    }
  });
});

// Fonction de démarrage du serveur
const startServer = async () => {
  try {
    console.log('🚀 Démarrage de l\'API SpotBulle IA...');
    
    // Établir les associations entre modèles
    setupAssociations();
    
    // Connecter à la base de données avec retry
    let dbConnected = false;
    let retries = 3;
    
    while (!dbConnected && retries > 0) {
      try {
        await connectDB();
        dbConnected = true;
        console.log('✅ Base de données connectée');
      } catch (dbError) {
        retries--;
        console.log(`⚠️ Tentative de connexion DB échouée, ${retries} essais restants`);
        if (retries === 0) {
          console.log('⚠️ Démarrage en mode dégradé sans base de données');
        } else {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }
    
    // Démarrer le serveur
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log('');
      console.log('🎉 ================================');
      console.log('🚀 API SpotBulle IA démarrée!');
      console.log('🎉 ================================');
      console.log(`🌍 URL: http://localhost:${PORT}`);
      console.log(`🔧 Environnement: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🤖 API IA: http://localhost:${PORT}/api/ia`);
      console.log(`🎨 Frontend: Déploiement séparé (Vercel)`);
      console.log(`💾 Base de données: ${dbConnected ? 'Connectée' : 'Mode dégradé'}`);
      console.log(`📦 Taille max uploads: 250MB`);
      console.log(`🔗 CORS: Activé pour Vercel + localhost`);
      console.log(`🔄 Routes: Disponibles avec et sans préfixe /api`);
      console.log('================================');
      console.log('');
    });

    // Gestion gracieuse de l'arrêt
    const gracefulShutdown = (signal) => {
      console.log(`\n🛑 Signal ${signal} reçu, arrêt gracieux...`);
      server.close(() => {
        console.log('✅ Serveur fermé proprement');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
  } catch (error) {
    console.error('❌ Erreur critique lors du démarrage:', error);
    process.exit(1);
  }
};

// Démarrer le serveur
startServer();

module.exports = app;

