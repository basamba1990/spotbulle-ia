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

// Import des modèles pour établir les associations
const User = require('./models/User');
const Event = require('./models/Event');
const Video = require('./models/Video');
const Participation = require('./models/Participation');

const app = express();
const PORT = process.env.PORT || 5000;

// Configuration des associations entre modèles
const setupAssociations = () => {
  // User associations
  User.hasMany(Event, { foreignKey: 'organisateur_id', as: 'evenements_organises' });
  User.hasMany(Video, { foreignKey: 'user_id', as: 'videos' });
  User.hasMany(Participation, { foreignKey: 'user_id', as: 'participations' });

  // Event associations
  Event.belongsTo(User, { foreignKey: 'organisateur_id', as: 'organisateur' });
  Event.hasMany(Participation, { foreignKey: 'evenement_id', as: 'participations' });

  // Video associations
  Video.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
  Video.hasOne(Participation, { foreignKey: 'video_id', as: 'participation' });

  // Participation associations
  Participation.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
  Participation.belongsTo(Event, { foreignKey: 'evenement_id', as: 'evenement' });
  Participation.belongsTo(Video, { foreignKey: 'video_id', as: 'video' });
};

// Configuration du rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limite chaque IP à 100 requêtes par windowMs
  message: {
    success: false,
    message: 'Trop de requêtes depuis cette IP, veuillez réessayer plus tard.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Configuration CORS
const corsOptions = {
  origin: function (origin, callback) {
    // Permettre les requêtes sans origine (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'http://localhost:3000',
      'http://localhost:3001'
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Non autorisé par CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

// Middlewares globaux
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors(corsOptions));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging en développement
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Rate limiting
app.use('/api/', limiter);

// Routes de santé
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'SpotBulle API est opérationnelle',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/videos', videoRoutes);

// Route par défaut
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Bienvenue sur l\'API SpotBulle',
    version: '1.0.0',
    documentation: '/api/docs',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      events: '/api/events',
      videos: '/api/videos'
    }
  });
});

// Middleware de gestion des erreurs 404
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route non trouvée',
    path: req.originalUrl
  });
});

// Middleware de gestion des erreurs globales
app.use((error, req, res, next) => {
  console.error('Erreur serveur:', error);

  // Erreur de validation Sequelize
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

  // Erreur de contrainte unique Sequelize
  if (error.name === 'SequelizeUniqueConstraintError') {
    return res.status(400).json({
      success: false,
      message: 'Violation de contrainte unique',
      field: error.errors[0]?.path
    });
  }

  // Erreur CORS
  if (error.message === 'Non autorisé par CORS') {
    return res.status(403).json({
      success: false,
      message: 'Origine non autorisée par CORS'
    });
  }

  // Erreur générique
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Erreur interne du serveur' 
      : error.message
  });
});

// Fonction de démarrage du serveur
const startServer = async () => {
  try {
    // Connexion à la base de données
    await connectDB();
    
    // Configuration des associations
    setupAssociations();
    
    // Démarrage du serveur
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Serveur SpotBulle démarré sur le port ${PORT}`);
      console.log(`🌍 Environnement: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📡 API disponible sur: http://localhost:${PORT}`);
      console.log(`🏥 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('❌ Erreur lors du démarrage du serveur:', error);
    process.exit(1);
  }
};

// Gestion des signaux de fermeture
process.on('SIGTERM', () => {
  console.log('🛑 Signal SIGTERM reçu, fermeture du serveur...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Signal SIGINT reçu, fermeture du serveur...');
  process.exit(0);
});

// Gestion des erreurs non capturées
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promesse rejetée non gérée:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Exception non capturée:', error);
  process.exit(1);
});

// Démarrer le serveur
startServer();

module.exports = app;

