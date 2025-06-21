// backend/src/server.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();
const path = require('path'); // <-- AJOUTEZ CETTE LIGNE

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
const PORT = process.env.PORT || 10000;

// Configuration des associations entre modèles
const setupAssociations = () => {
  // User associations
  User.hasMany(Event, { foreignKey: 'organisateur_id', as: 'evenements_organises' });
  User.hasMany(Video, { foreignKey: 'user_id', as: 'videos' });
  User.hasMany(Participation, { foreignKey: 'user_id', as: 'participations' });

  // Event associations
  Event.belongsTo(User, { foreignKey: 'organisateur_id', as: 'organisateur' });
  Event.hasMany(Participation, { foreignKey: 'evenement_id', as: 'participations' });
  Event.hasMany(Video, { foreignKey: 'evenement_id', as: 'videos' });

  // Video associations
  Video.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
  Video.belongsTo(Event, { foreignKey: 'evenement_id', as: 'evenement' });
  Video.belongsTo(Participation, { foreignKey: 'participation_id', as: 'participation' });

  // Participation associations
  Participation.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
  Participation.belongsTo(Event, { foreignKey: 'evenement_id', as: 'evenement' });
  Participation.hasMany(Video, { foreignKey: 'participation_id', as: 'videos' });
};

// Configuration du rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limite chaque IP à 100 requêtes par windowMs
  message: {
    error: 'Trop de requêtes depuis cette IP, veuillez réessayer plus tard.'
  }
});

// Middlewares de sécurité et configuration
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

app.use(cors({
  origin: process.env.FRONTEND_URL || ['https://spotbulle-ia.vercel.app'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(compression());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(limiter);

// --- DÉBUT DES CORRECTIONS À APPLIQUER DANS backend/src/server.js ---

// Ajoutez cette ligne pour faire confiance aux en-têtes de proxy
// '1' signifie faire confiance au premier proxy (comme Render.com ou Cloudflare)
// Cela permet à express-rate-limit et autres middlewares d'obtenir l'IP réelle du client.
app.set('trust proxy', 1); // <-- AJOUTEZ CETTE LIGNE ICI

// Servez les fichiers statiques (comme favicon.ico) depuis le dossier 'public'
// Assurez-vous que le dossier 'public' existe à la racine de votre projet
// (par exemple, au même niveau que le dossier 'backend').
app.use(express.static(path.join(__dirname, '../../public'))); // <-- AJOUTEZ CETTE LIGNE ICI

// --- FIN DES CORRECTIONS À APPLIQUER DANS backend/src/server.js ---

// Middlewares pour le parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Route de santé (ne nécessite pas de DB)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Serveur SpotBulle opérationnel',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Route de test de base de données
app.get('/api/health/db', async (req, res) => {
  try {
    const { sequelize } = require('./config/db');
    await sequelize.authenticate();
    res.status(200).json({
      status: 'OK',
      message: 'Base de données connectée',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: 'Erreur de connexion à la base de données',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/videos', videoRoutes);

// Routes de compatibilité (sans préfixe /api)
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/events', eventRoutes);
app.use('/videos', videoRoutes);

// Routes spécifiques pour les appels directs (correction urgente)
const authController = require('./controllers/authController');
const { body } = require('express-validator');

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Email invalide'),
  body('password').notEmpty().withMessage('Mot de passe requis')
];

const registerValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Email invalide'),
  body('password').isLength({ min: 6 }).withMessage('Le mot de passe doit contenir au moins 6 caractères'),
  body('nom').trim().isLength({ min: 2, max: 50 }).withMessage('Le nom doit contenir entre 2 et 50 caractères'),
  body('prenom').trim().isLength({ min: 2, max: 50 }).withMessage('Le prénom doit contenir entre 2 et 50 caractères')
];

// app.post("/login", loginValidation, authController.login);
// app.post("/register", registerValidation, authController.register);

// Route par défaut
app.get('/', (req, res) => {
  res.json({
    message: 'API SpotBulle - Plateforme de partage vidéo',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      users: '/api/users',
      events: '/api/events',
      videos: '/api/videos'
    }
  });
});

// Middleware de gestion d'erreurs
app.use((err, req, res, next) => {
  console.error('❌ Erreur serveur:', err);
  
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Erreur interne du serveur' 
      : err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Middleware pour les routes non trouvées
app.use('*', (req, res) => {
  console.log(`❌ Route non trouvée: ${req.method} ${req.originalUrl}`);
  console.log(`Headers: ${JSON.stringify(req.headers, null, 2)}`);
  
  res.status(404).json({
    success: false,
    message: 'Route non trouvée',
    path: req.originalUrl,
    method: req.method,
    suggestion: req.originalUrl.startsWith('/api/') 
      ? 'Vérifiez que la route API existe' 
      : `Essayez peut-être /api${req.originalUrl}`,
    availableRoutes: {
      auth: '/api/auth (POST /login, POST /register, GET /me)',
      videos: '/api/videos (GET /, GET /:id, POST /upload)',
      events: '/api/events (GET /, GET /:id, POST /)',
      users: '/api/users (GET /profile, PUT /profile)'
    }
  });
});

// Fonction de démarrage du serveur
const startServer = async () => {
  try {
    // Établir les associations entre modèles
    setupAssociations();
    
    // Connecter à la base de données (en mode dégradé si échec en production)
    await connectDB();
    
    // Démarrer le serveur
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Serveur SpotBulle démarré sur le port ${PORT}`);
      console.log(`🌍 Environnement: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📡 Health check: http://localhost:${PORT}/health`);
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

// Démarrer le serveur
startServer();
