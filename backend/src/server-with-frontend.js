// backend/src/server-with-frontend.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();
const path = require('path');

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
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https:"],
    },
  },
}));

app.use(cors({
  origin: process.env.FRONTEND_URL || ['https://spotbulle-ia.vercel.app', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(compression());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(limiter);

// Faire confiance aux en-têtes de proxy
app.set('trust proxy', 1);

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
app.use('/api/ia', analyseIARoutes);

// Routes de compatibilité (sans préfixe /api)
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/events', eventRoutes);
app.use('/videos', videoRoutes);
app.use('/ia', analyseIARoutes);

// Servir les fichiers statiques Next.js
app.use('/_next/static', express.static(path.join(__dirname, '../../frontend/.next/static')));
app.use('/static', express.static(path.join(__dirname, '../../frontend/.next/static')));

// Servir les fichiers statiques publics
app.use(express.static(path.join(__dirname, '../../public')));
app.use(express.static(path.join(__dirname, '../../frontend/public')));

// Route pour servir le frontend Next.js pour toutes les routes non-API
app.get('*', (req, res, next) => {
  // Si c'est une route API, passer au middleware suivant
  if (req.path.startsWith('/api/') || req.path.startsWith('/health')) {
    return next();
  }
  
  // Servir le fichier HTML principal du frontend
  const htmlPath = path.join(__dirname, '../../frontend/.next/server/app');
  
  // Pour les routes dynamiques, servir la page appropriée
  try {
    if (req.path === '/' || req.path === '/index.html') {
      res.sendFile(path.join(htmlPath, 'page.html'));
    } else if (req.path === '/login') {
      res.sendFile(path.join(htmlPath, '(auth)/login/page.html'));
    } else if (req.path === '/register') {
      res.sendFile(path.join(htmlPath, '(auth)/register/page.html'));
    } else if (req.path === '/dashboard') {
      res.sendFile(path.join(htmlPath, 'dashboard/page.html'));
    } else if (req.path === '/ia') {
      res.sendFile(path.join(htmlPath, 'ia/page.html'));
    } else if (req.path === '/ia-simple') {
      res.sendFile(path.join(htmlPath, 'ia-simple/page.html'));
    } else if (req.path === '/upload') {
      res.sendFile(path.join(htmlPath, 'upload/page.html'));
    } else if (req.path === '/test-auth') {
      res.sendFile(path.join(htmlPath, 'test-auth/page.html'));
    } else if (req.path.startsWith('/events/')) {
      res.sendFile(path.join(htmlPath, 'events/[id]/page.html'));
    } else {
      // Page par défaut
      res.sendFile(path.join(htmlPath, 'page.html'));
    }
  } catch (error) {
    console.error('Erreur lors du service du frontend:', error);
    // Fallback vers une réponse simple
    res.status(200).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>SpotBulle IA</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          .container { max-width: 800px; margin: 0 auto; }
          .api-info { background: #f5f5f5; padding: 20px; border-radius: 8px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🚀 SpotBulle IA - Plateforme de partage vidéo</h1>
          <p>Bienvenue sur SpotBulle IA, la plateforme de partage vidéo avec intelligence artificielle.</p>
          
          <div class="api-info">
            <h2>API Endpoints disponibles:</h2>
            <ul>
              <li><strong>GET /health</strong> - Vérification de l'état du serveur</li>
              <li><strong>POST /api/auth/login</strong> - Connexion utilisateur</li>
              <li><strong>POST /api/auth/register</strong> - Inscription utilisateur</li>
              <li><strong>GET /api/videos</strong> - Liste des vidéos</li>
              <li><strong>GET /api/events</strong> - Liste des événements</li>
              <li><strong>POST /api/ia/videos/:id/analyser</strong> - Analyse IA d'une vidéo</li>
            </ul>
          </div>
          
          <p><a href="/api">Voir toutes les routes API</a></p>
        </div>
        
        <script>
          // Redirection automatique vers le frontend Vercel si disponible
          if (window.location.hostname.includes('onrender.com')) {
            console.log('Serveur backend opérationnel. Frontend disponible sur Vercel.');
          }
        </script>
      </body>
      </html>
    `);
  }
});

// Route API par défaut
app.get('/api', (req, res) => {
  res.json({
    message: 'API SpotBulle - Plateforme de partage vidéo avec IA',
    version: '1.1.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      users: '/api/users',
      events: '/api/events',
      videos: '/api/videos',
      ia: '/api/ia'
    },
    nouvelles_fonctionnalites: {
      analyse_ia: 'Analyse automatique des pitchs vidéo',
      transcription: 'Transcription audio vers texte',
      mots_cles: 'Extraction automatique de mots-clés',
      similarite: 'Recherche de projets similaires',
      resume: 'Génération automatique de résumés'
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
      console.log(`🤖 Nouvelles fonctionnalités IA disponibles sur /api/ia`);
      console.log(`🎨 Frontend intégré disponible sur http://localhost:${PORT}/`);
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

