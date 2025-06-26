// backend/src/server-with-frontend.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();
const path = require('path');
const fs = require('fs');

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

// Middlewares pour le parsing avec limite de taille augmentée à 100MB
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

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
const frontendPath = path.join(__dirname, '../../frontend');
const nextStaticPath = path.join(frontendPath, '.next/static');
const publicPath = path.join(__dirname, '../../public');
const frontendPublicPath = path.join(frontendPath, 'public');

// Servir les fichiers statiques Next.js
if (fs.existsSync(nextStaticPath)) {
  app.use('/_next/static', express.static(nextStaticPath, { maxAge: '1y' }));
  app.use('/static', express.static(nextStaticPath, { maxAge: '1y' }));
}

// Servir les fichiers statiques publics
if (fs.existsSync(publicPath)) {
  app.use(express.static(publicPath, { maxAge: '1d' }));
}
if (fs.existsSync(frontendPublicPath)) {
  app.use(express.static(frontendPublicPath, { maxAge: '1d' }));
}

// Route pour servir le frontend Next.js pour toutes les routes non-API
app.get('*', (req, res, next) => {
  // Si c'est une route API, passer au middleware suivant
  if (req.path.startsWith('/api/') || req.path.startsWith('/health')) {
    return next();
  }
  
  // Chemin vers les fichiers HTML du build Next.js
  const nextServerPath = path.join(frontendPath, '.next/server');
  const nextAppPath = path.join(nextServerPath, 'app');
  
  // Fonction pour servir un fichier HTML s'il existe
  const serveHtmlFile = (filePath) => {
    if (fs.existsSync(filePath)) {
      return res.sendFile(filePath);
    }
    return false;
  };
  
  try {
    let served = false;
    
    // Mapping des routes vers les fichiers HTML
    if (req.path === '/' || req.path === '/index.html') {
      served = serveHtmlFile(path.join(nextAppPath, 'page.html'));
    } else if (req.path === '/login') {
      served = serveHtmlFile(path.join(nextAppPath, '(auth)/login/page.html'));
    } else if (req.path === '/register') {
      served = serveHtmlFile(path.join(nextAppPath, '(auth)/register/page.html'));
    } else if (req.path === '/dashboard') {
      served = serveHtmlFile(path.join(nextAppPath, 'dashboard/page.html'));
    } else if (req.path === '/ia') {
      served = serveHtmlFile(path.join(nextAppPath, 'ia/page.html'));
    } else if (req.path === '/ia-simple') {
      served = serveHtmlFile(path.join(nextAppPath, 'ia-simple/page.html'));
    } else if (req.path === '/upload') {
      served = serveHtmlFile(path.join(nextAppPath, 'upload/page.html'));
    } else if (req.path === '/test-auth') {
      served = serveHtmlFile(path.join(nextAppPath, 'test-auth/page.html'));
    } else if (req.path.startsWith('/events/')) {
      served = serveHtmlFile(path.join(nextAppPath, 'events/[id]/page.html'));
    }
    
    // Si aucun fichier HTML spécifique n'a été trouvé, essayer la page par défaut
    if (!served) {
      served = serveHtmlFile(path.join(nextAppPath, 'page.html'));
    }
    
    // Si toujours pas de fichier HTML, servir une page de fallback
    if (!served) {
      console.log('⚠️  Aucun fichier HTML Next.js trouvé, utilisation du fallback');
      res.status(200).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>SpotBulle IA</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
              margin: 0; 
              padding: 40px; 
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              min-height: 100vh;
            }
            .container { 
              max-width: 800px; 
              margin: 0 auto; 
              background: rgba(255,255,255,0.1);
              padding: 40px;
              border-radius: 20px;
              backdrop-filter: blur(10px);
            }
            .api-info { 
              background: rgba(255,255,255,0.1); 
              padding: 20px; 
              border-radius: 12px; 
              margin: 20px 0;
            }
            h1 { color: #fff; margin-bottom: 20px; }
            h2 { color: #f0f0f0; }
            a { color: #ffd700; text-decoration: none; }
            a:hover { text-decoration: underline; }
            ul { list-style-type: none; padding: 0; }
            li { margin: 10px 0; padding: 10px; background: rgba(255,255,255,0.05); border-radius: 8px; }
            .status { 
              display: inline-block; 
              background: #4CAF50; 
              color: white; 
              padding: 4px 12px; 
              border-radius: 20px; 
              font-size: 12px; 
              margin-left: 10px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🚀 SpotBulle IA - Plateforme de partage vidéo</h1>
            <p>Bienvenue sur SpotBulle IA, la plateforme de partage vidéo avec intelligence artificielle.</p>
            <p><span class="status">✅ Backend opérationnel</span></p>
            
            <div class="api-info">
              <h2>🔗 API Endpoints disponibles:</h2>
              <ul>
                <li><strong>GET <a href="/health">/health</a></strong> - Vérification de l'état du serveur</li>
                <li><strong>POST /api/auth/login</strong> - Connexion utilisateur</li>
                <li><strong>POST /api/auth/register</strong> - Inscription utilisateur</li>
                <li><strong>GET /api/videos</strong> - Liste des vidéos</li>
                <li><strong>GET /api/events</strong> - Liste des événements</li>
                <li><strong>POST /api/ia/videos/:id/analyser</strong> - Analyse IA d'une vidéo</li>
              </ul>
            </div>
            
            <p><a href="/api">📋 Voir toutes les routes API</a></p>
            
            <div class="api-info">
              <h2>🤖 Nouvelles fonctionnalités IA:</h2>
              <ul>
                <li>Analyse automatique des pitchs vidéo</li>
                <li>Transcription audio vers texte</li>
                <li>Extraction automatique de mots-clés</li>
                <li>Recherche de projets similaires</li>
                <li>Génération automatique de résumés</li>
              </ul>
            </div>
          </div>
          
          <script>
            console.log('🚀 SpotBulle IA Backend - Version 1.1.0');
            console.log('📡 API disponible sur:', window.location.origin + '/api');
            console.log('🔍 Health check:', window.location.origin + '/health');
          </script>
        </body>
        </html>
      `);
    }
  } catch (error) {
    console.error('❌ Erreur lors du service du frontend:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur',
      message: 'Impossible de servir le frontend',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Route API par défaut
app.get('/api', (req, res) => {
  res.json({
    message: 'API SpotBulle - Plateforme de partage vidéo avec IA',
    version: '1.1.0',
    status: 'operational',
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
    },
    frontend: {
      status: fs.existsSync(path.join(__dirname, '../../frontend/.next')) ? 'built' : 'not_built',
      routes: ['/', '/login', '/register', '/dashboard', '/ia', '/ia-simple', '/upload', '/test-auth', '/events/:id']
    }
  });
});

// Middleware de gestion d'erreurs
app.use((err, req, res, next) => {
  console.error('❌ Erreur serveur:', err);
  
  // Gestion spécifique des erreurs de taille de payload
  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      success: false,
      message: 'Fichier trop volumineux. Taille maximale: 1002MB'
    });
  }
  
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
      users: '/api/users (GET /profile, PUT /profile)',
      ia: '/api/ia (POST /videos/:id/analyser, GET /videos/:id/resultats, GET /videos/:id/similaires)'
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
    
    // Vérifier si le frontend est buildé
    const frontendBuilt = fs.existsSync(path.join(__dirname, '../../frontend/.next'));
    console.log(`🎨 Frontend Next.js: ${frontendBuilt ? '✅ Buildé' : '⚠️  Non buildé'}`);
    
    // Démarrer le serveur
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Serveur SpotBulle démarré sur le port ${PORT}`);
      console.log(`🌍 Environnement: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📡 Health check: http://localhost:${PORT}/health`);
      console.log(`🤖 Nouvelles fonctionnalités IA disponibles sur /api/ia`);
      console.log(`🎨 Frontend intégré disponible sur http://localhost:${PORT}/`);
      console.log(`📦 Taille max des uploads: 50MB`);
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
