const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');

// Configuration de l'environnement
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 10000;

// Configuration CORS pour la production
const corsOptions = {
  origin: function (origin, callback) {
    // Permettre les requêtes sans origine (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    // Liste des origines autorisées en production
    const allowedOrigins = [
      'https://spotbulle-ia.vercel.app',
      process.env.FRONTEND_URL,
      'http://localhost:3000', // Pour les tests locaux
    ].filter(Boolean);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`CORS: Origine non autorisée: ${origin}`);
      // En production, être plus strict
      if (process.env.NODE_ENV === 'production') {
        callback(new Error('Non autorisé par CORS'));
      } else {
        callback(null, true);
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count']
};

// Middlewares de sécurité renforcés pour la production
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.openai.com", "https://api.nlpcloud.io"],
    },
  },
}));

app.use(compression());
app.use(cors(corsOptions));

// Middleware de logging adapté à l'environnement
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined'));
} else {
  app.use(morgan('dev'));
}

// Rate limiting renforcé pour la production
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    success: false,
    message: 'Trop de requêtes, veuillez réessayer plus tard.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Exclure les routes de santé du rate limiting
    return req.path === '/health' || req.path === '/';
  }
});

app.set('trust proxy', 1); // Activer trust proxy pour les en-têtes X-Forwarded-For
app.use(limiter);

// Middleware pour parser les données avec limites adaptées
const maxFileSize = process.env.MAX_FILE_SIZE || '250mb';
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Créer le dossier uploads s'il n'existe pas
const uploadsDir = process.env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log(`Dossier uploads créé: ${uploadsDir}`);
}

// Servir les fichiers statiques avec cache
app.use('/uploads', express.static(uploadsDir, {
  maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0
}));

// Middleware de logging des requêtes (conditionnel)
if (process.env.ENABLE_REQUEST_LOGGING === 'true') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - IP: ${req.ip}`);
    next();
  });
}

// Route de santé
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Serveur SpotBulle IA opérationnel',
    timestamp: new Date().toISOString(),
    version: '1.1.1',
    environment: process.env.NODE_ENV || 'development',
    features: {
      ai: process.env.ENABLE_AI_FEATURES === 'true',
      supabase: !!process.env.SUPABASE_URL,
      openai: !!process.env.OPENAI_API_KEY
    }
  });
});

// Route racine
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'API SpotBulle IA',
    version: '1.1.1',
    documentation: '/api/docs',
    health: '/health',
    environment: process.env.NODE_ENV
  });
});

// Initialisation de la base de données
const { sequelize, connectDB } = require('./config');

// Connexion à la base de données
connectDB().catch(err => {
  console.error('Erreur lors de l\'initialisation de la base de données:', err);
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

// Import des routes avec gestion d'erreurs
try {
  const authRoutes = require('./routes/authRoutes');
  const userRoutes = require('./routes/userRoutes');
  const videoRoutes = require('./routes/videoRoutes');
  const eventRoutes = require('./routes/eventRoutes');
  const analyseIARoutes = require('./routes/analyseIARoutes');

  // Configuration des routes avec préfixe /api
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/videos', videoRoutes);
  app.use('/api/events', eventRoutes);
  app.use('/api/ia', analyseIARoutes);

  // Routes sans préfixe pour compatibilité
  app.use('/auth', authRoutes);
  app.use('/users', userRoutes);
  app.use('/videos', videoRoutes);
  app.use('/events', eventRoutes);
  app.use('/ia', analyseIARoutes);
  
  console.log('✅ Routes chargées avec succès');
} catch (error) {
  console.error('❌ Erreur lors du chargement des routes:', error.message);
  
  // Routes de fallback pour les tests
  app.get('/api/videos', (req, res) => {
    res.json({
      success: true,
      message: 'Route de test - vidéos',
      data: { videos: [] }
    });
  });
  
  app.get('/api/ia/statistiques', (req, res) => {
    res.json({
      success: true,
      data: {
        statistiques: {
          total: 0,
          en_attente: 0,
          en_cours: 0,
          complete: 0,
          echec: 0
        }
      }
    });
  });
}

// Middleware de gestion des erreurs 404
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route non trouvée: ${req.method} ${req.originalUrl}`,
    availableRoutes: [
      'GET /',
      'GET /health',
      'POST /auth/login',
      'POST /auth/register',
      'GET /videos',
      'POST /videos/upload',
      'GET /events',
      'POST /ia/analyser/:videoId'
    ]
  });
});

// Middleware de gestion des erreurs globales
app.use((error, req, res, next) => {
  console.error('Erreur serveur:', error);
  
  // Erreur de validation Multer
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      message: 'Fichier trop volumineux',
      maxSize: process.env.MAX_FILE_SIZE || '250MB'
    });
  }
  
  // Erreur de validation JSON
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({
      success: false,
      message: 'Format JSON invalide'
    });
  }
  
  // Erreur de base de données
  if (error.name === 'SequelizeValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Erreur de validation',
      errors: error.errors.map(err => ({
        field: err.path,
        message: err.message
      }))
    });
  }
  
  // Erreur CORS
  if (error.message === 'Non autorisé par CORS') {
    return res.status(403).json({
      success: false,
      message: 'Origine non autorisée'
    });
  }
  
  // Erreur générique
  res.status(error.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Erreur interne du serveur'
      : error.message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// Gestion gracieuse de l'arrêt du serveur
const gracefulShutdown = (signal) => {
  console.log(`${signal} reçu, arrêt gracieux du serveur...`);
  server.close(() => {
    console.log('Serveur fermé.');
    if (sequelize) {
      sequelize.close().then(() => {
        console.log('Connexion base de données fermée.');
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Gestion des erreurs non capturées
process.on('uncaughtException', (error) => {
  console.error('Erreur non capturée:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Promesse rejetée non gérée:', reason);
  process.exit(1);
});

// Démarrage du serveur
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`
🚀 Serveur SpotBulle IA démarré avec succès!
📍 URL: http://0.0.0.0:${PORT}
🌍 Environnement: ${process.env.NODE_ENV || 'development'}
📊 Health check: http://0.0.0.0:${PORT}/health
📚 API: http://0.0.0.0:${PORT}/api
🔒 CORS: ${process.env.FRONTEND_URL || 'localhost autorisé'}
🤖 IA: ${process.env.ENABLE_AI_FEATURES === 'true' ? 'Activée' : 'Désactivée'}
  `);
});

// Gestion des erreurs de démarrage
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Le port ${PORT} est déjà utilisé.`);
    process.exit(1);
  } else {
    console.error('❌ Erreur lors du démarrage du serveur:', error);
    process.exit(1);
  }
});

module.exports = app;



// Initialisation des associations Sequelize
const models = require("./models");
Object.keys(models).forEach(modelName => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});


