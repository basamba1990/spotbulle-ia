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
const PORT = process.env.PORT || 5000;

// Configuration CORS améliorée
const corsOptions = {
  origin: function (origin, callback) {
    // Permettre les requêtes sans origine (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    // Liste des origines autorisées
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://spotbulle-ia.vercel.app',
      process.env.CORS_ORIGIN
    ].filter(Boolean);
    
    // En développement, permettre toutes les origines localhost
    if (process.env.NODE_ENV === 'development' && origin.includes('localhost')) {
      return callback(null, true);
    }
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`CORS: Origine non autorisée: ${origin}`);
      callback(null, true); // Permettre quand même en développement
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count']
};

// Middlewares de sécurité et performance
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false // Désactiver CSP pour éviter les problèmes avec les uploads
}));
app.use(compression());
app.use(cors(corsOptions));

// Middleware de logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 1000 : 100, // Plus permissif en dev
  message: {
    success: false,
    message: 'Trop de requêtes, veuillez réessayer plus tard.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Middleware pour parser les données
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

// Créer le dossier uploads s'il n'existe pas
const uploadsDir = process.env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log(`Dossier uploads créé: ${uploadsDir}`);
}

// Servir les fichiers statiques
app.use('/uploads', express.static(uploadsDir));

// Middleware de logging des requêtes
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Route de santé
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Serveur SpotBulle IA opérationnel',
    timestamp: new Date().toISOString(),
    version: '1.1.1',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Route racine
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'API SpotBulle IA',
    version: '1.1.1',
    documentation: '/api/docs',
    health: '/health'
  });
});

// Initialisation de la base de données
const { sequelize, connectDB } = require('./config/db');

// Connexion à la base de données
connectDB().catch(err => {
  console.error('Erreur lors de l\'initialisation de la base de données:', err);
});

// Import des routes
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
      maxSize: process.env.MAX_FILE_SIZE || '100MB'
    });
  }
  
  // Erreur de validation JSON
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({
      success: false,
      message: 'Format JSON invalide'
    });
  }
  
  // Erreur générique
  res.status(error.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'development' 
      ? error.message 
      : 'Erreur interne du serveur',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// Gestion gracieuse de l'arrêt du serveur
process.on('SIGTERM', () => {
  console.log('SIGTERM reçu, arrêt gracieux du serveur...');
  server.close(() => {
    console.log('Serveur fermé.');
    if (sequelize) {
      sequelize.close();
    }
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT reçu, arrêt gracieux du serveur...');
  server.close(() => {
    console.log('Serveur fermé.');
    if (sequelize) {
      sequelize.close();
    }
    process.exit(0);
  });
});

// Démarrage du serveur
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`
🚀 Serveur SpotBulle IA démarré avec succès!
📍 URL: http://localhost:${PORT}
🌍 Environnement: ${process.env.NODE_ENV || 'development'}
📊 Health check: http://localhost:${PORT}/health
📚 API: http://localhost:${PORT}/api
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

