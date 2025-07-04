// backend/src/server-with-frontend.js - VERSION CORRIGÉE
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

// Configuration du rate limiting améliorée
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Augmenté pour éviter les blocages
  message: {
    error: 'Trop de requêtes depuis cette IP, veuillez réessayer plus tard.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Middlewares de sécurité et configuration améliorés
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

// Configuration CORS améliorée
app.use(cors({
  origin: function (origin, callback) {
    // Permettre les requêtes sans origine (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'https://spotbulle-ia.vercel.app',
      'https://spotbulle-ia.onrender.com',
      'https://spotbulle-jrxlpa9ha-samba-bas-projects.vercel.app',
      'http://localhost:3000',
      'http://localhost:3001'
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
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

// Route de santé améliorée
app.get("/api/health", async (req, res) => {
  try {
    const healthStatus = {
      status: 'OK',
      message: 'Serveur SpotBulle opérationnel',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.1.1',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      frontend: {
        built: fs.existsSync(path.join(__dirname, '../../frontend/.next')),
        staticFiles: fs.existsSync(path.join(__dirname, '../../public/static'))
      }
    };

    // Test de connexion DB optionnel
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

// Route de test de base de données améliorée
app.get('/api/health/db', async (req, res) => {
  try {
    const { sequelize } = require('./config/db');
    await sequelize.authenticate();
    
    // Test d'une requête simple
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

// Routes API avec logging amélioré
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

// Routes de compatibilité (sans préfixe /api)
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/events', eventRoutes);
app.use('/videos', videoRoutes);
app.use('/ia', analyseIARoutes);

// Configuration des chemins statiques améliorée
const frontendPath = path.join(__dirname, '../../frontend');
const nextStaticPath = path.join(frontendPath, '.next/static');
const nextServerPath = path.join(frontendPath, '.next/server');
const publicPath = path.join(__dirname, '../../public');
const frontendPublicPath = path.join(frontendPath, 'public');

// Servir les fichiers statiques Next.js avec cache optimisé
if (fs.existsSync(nextStaticPath)) {
  console.log('✅ Fichiers statiques Next.js trouvés');
  app.use('/_next/static', express.static(nextStaticPath, { 
    maxAge: '1y',
    immutable: true,
    setHeaders: (res, path) => {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
  }));
  app.use('/static', express.static(nextStaticPath, { maxAge: '1y' }));
} else {
  console.log('⚠️ Fichiers statiques Next.js non trouvés');
}

// Servir les fichiers publics
[publicPath, frontendPublicPath].forEach(staticPath => {
  if (fs.existsSync(staticPath)) {
    console.log(`✅ Fichiers publics trouvés: ${staticPath}`);
    app.use(express.static(staticPath, { maxAge: '1d' }));
  }
});

// Fonction pour servir les pages Next.js améliorée
const serveNextPage = (req, res, next) => {
  // Si c'est une route API, passer au middleware suivant
  if (req.path.startsWith('/api/') || req.path.startsWith('/health')) {
    return next();
  }
  
  const nextAppPath = path.join(nextServerPath, 'app');
  
  // Fonction pour servir un fichier HTML s'il existe
  const serveHtmlFile = (filePath) => {
    if (fs.existsSync(filePath)) {
      console.log(`✅ Serving HTML: ${filePath}`);
      return res.sendFile(filePath);
    }
    return false;
  };
  
  try {
    let served = false;
    
    // Mapping des routes vers les fichiers HTML avec logging
    console.log(`🔍 Tentative de service de la route: ${req.path}`);
    
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
    
    // Si toujours pas de fichier HTML, servir une page de fallback améliorée
    if (!served) {
      console.log('⚠️ Aucun fichier HTML Next.js trouvé, utilisation du fallback amélioré');
      res.status(200).send(`
        <!DOCTYPE html>
        <html lang="fr">
        <head>
          <title>SpotBulle IA - Plateforme de partage vidéo</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <meta name="description" content="Plateforme de partage vidéo avec intelligence artificielle">
          <link rel="icon" href="/favicon.ico">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .container { 
              max-width: 900px; 
              margin: 0 auto; 
              background: rgba(255,255,255,0.1);
              padding: 40px;
              border-radius: 20px;
              backdrop-filter: blur(10px);
              box-shadow: 0 8px 32px rgba(0,0,0,0.1);
            }
            .header { text-align: center; margin-bottom: 30px; }
            .status-badge { 
              display: inline-block; 
              background: #4CAF50; 
              color: white; 
              padding: 8px 16px; 
              border-radius: 25px; 
              font-size: 14px; 
              margin: 10px 5px;
              font-weight: 500;
            }
            .error-badge { background: #f44336; }
            .warning-badge { background: #ff9800; }
            .api-section { 
              background: rgba(255,255,255,0.1); 
              padding: 25px; 
              border-radius: 15px; 
              margin: 20px 0;
            }
            .api-grid { 
              display: grid; 
              grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); 
              gap: 15px; 
              margin-top: 20px;
            }
            .api-item { 
              background: rgba(255,255,255,0.05); 
              padding: 15px; 
              border-radius: 10px; 
              border-left: 4px solid #ffd700;
            }
            .api-method { 
              font-weight: bold; 
              color: #ffd700; 
              font-size: 12px;
            }
            .api-path { 
              font-family: 'Courier New', monospace; 
              margin: 5px 0;
            }
            .api-desc { 
              font-size: 14px; 
              opacity: 0.9;
            }
            h1 { font-size: 2.5em; margin-bottom: 10px; }
            h2 { color: #f0f0f0; margin-bottom: 15px; }
            a { color: #ffd700; text-decoration: none; transition: all 0.3s; }
            a:hover { text-decoration: underline; transform: translateY(-1px); }
            .debug-info { 
              font-size: 12px; 
              opacity: 0.7; 
              margin-top: 20px; 
              text-align: center;
            }
            @media (max-width: 768px) {
              .container { margin: 20px; padding: 20px; }
              h1 { font-size: 2em; }
              .api-grid { grid-template-columns: 1fr; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚀 SpotBulle IA</h1>
              <p>Plateforme de partage vidéo avec intelligence artificielle</p>
              <div>
                <span class="status-badge">✅ Backend opérationnel</span>
                <span class="warning-badge">⚠️ Frontend en cours de chargement</span>
              </div>
            </div>
            
            <div class="api-section">
              <h2>🔗 API Endpoints disponibles</h2>
              <div class="api-grid">
                <div class="api-item">
                  <div class="api-method">GET</div>
                  <div class="api-path"><a href="/health">/health</a></div>
                  <div class="api-desc">Vérification de l'état du serveur</div>
                </div>
                <div class="api-item">
                  <div class="api-method">POST</div>
                  <div class="api-path">/api/auth/login</div>
                  <div class="api-desc">Connexion utilisateur</div>
                </div>
                <div class="api-item">
                  <div class="api-method">POST</div>
                  <div class="api-path">/api/auth/register</div>
                  <div class="api-desc">Inscription utilisateur</div>
                </div>
                <div class="api-item">
                  <div class="api-method">GET</div>
                  <div class="api-path">/api/videos</div>
                  <div class="api-desc">Liste des vidéos</div>
                </div>
                <div class="api-item">
                  <div class="api-method">GET</div>
                  <div class="api-path">/api/events</div>
                  <div class="api-desc">Liste des événements</div>
                </div>
                <div class="api-item">
                  <div class="api-method">POST</div>
                  <div class="api-path">/api/ia/videos/:id/analyser</div>
                  <div class="api-desc">Analyse IA d'une vidéo</div>
                </div>
              </div>
            </div>
            
            <div class="api-section">
              <h2>🤖 Fonctionnalités IA disponibles</h2>
              <div class="api-grid">
                <div class="api-item">
                  <div class="api-desc">🎯 Analyse automatique des pitchs vidéo</div>
                </div>
                <div class="api-item">
                  <div class="api-desc">🎤 Transcription audio vers texte</div>
                </div>
                <div class="api-item">
                  <div class="api-desc">🔍 Extraction automatique de mots-clés</div>
                </div>
                <div class="api-item">
                  <div class="api-desc">🔗 Recherche de projets similaires</div>
                </div>
                <div class="api-item">
                  <div class="api-desc">📝 Génération automatique de résumés</div>
                </div>
                <div class="api-item">
                  <div class="api-desc">📊 Statistiques et recommandations</div>
                </div>
              </div>
            </div>
            
            <div class="debug-info">
              <p>🔧 Mode: ${process.env.NODE_ENV || 'development'} | Version: 1.1.1</p>
              <p>⏰ ${new Date().toLocaleString('fr-FR')}</p>
              <p>🌐 <a href="/api">Documentation API complète</a></p>
            </div>
          </div>
          
          <script>
            console.log('🚀 SpotBulle IA Backend - Version 1.1.1');
            console.log('📡 API disponible sur:', window.location.origin + '/api');
            console.log("🔍 Health check:", window.location.origin + "/api/health");
            
            // Tentative de redirection vers le frontend si disponible
            setTimeout(() => {
              fetch('/api/health')
                .then(response => response.json())
                .then(data => {
                  if (data.frontend && data.frontend.built) {
                    console.log('✅ Frontend détecté, rechargement...');
                    window.location.reload();
                  }
                })
                .catch(err => console.log('⚠️ Frontend non disponible:', err));
            }, 5000);
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
};

// Appliquer le middleware pour toutes les routes non-API
app.get('*', serveNextPage);

// Route API par défaut améliorée
app.get('/api', (req, res) => {
  const frontendStatus = {
    built: fs.existsSync(path.join(__dirname, '../../frontend/.next')),
    staticFiles: fs.existsSync(path.join(__dirname, '../../public/static')),
    serverFiles: fs.existsSync(path.join(__dirname, '../../frontend/.next/server'))
  };

  res.json({
    message: 'API SpotBulle - Plateforme de partage vidéo avec IA',
    version: '1.1.1',
    status: 'operational',
    timestamp: new Date().toISOString(),
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
      resume: 'Génération automatique de résumés',
      statistiques: 'Statistiques et recommandations personnalisées'
    },
    frontend: frontendStatus,
    environment: process.env.NODE_ENV || 'development'
  });
});

// Middleware de gestion d'erreurs amélioré
app.use((err, req, res, next) => {
  console.error('❌ Erreur serveur:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });
  
  // Gestion spécifique des erreurs de taille de payload
  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      success: false,
      message: 'Fichier trop volumineux. Taille maximale: 250MB'
    });
  }
  
  // Gestion des erreurs de parsing JSON
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

// Middleware pour les routes non trouvées amélioré
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

// Fonction de démarrage du serveur améliorée
const startServer = async () => {
  try {
    console.log('🚀 Démarrage de SpotBulle IA...');
    
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
    
    // Vérifier l'état du frontend
    const frontendBuilt = fs.existsSync(path.join(__dirname, '../../frontend/.next'));
    const staticFiles = fs.existsSync(path.join(__dirname, '../../public/static'));
    
    console.log(`🎨 Frontend Next.js: ${frontendBuilt ? '✅ Buildé' : '⚠️ Non buildé'}`);
    console.log(`📁 Fichiers statiques: ${staticFiles ? '✅ Présents' : '⚠️ Absents'}`);
    
    // Démarrer le serveur
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log('');
      console.log('🎉 ================================');
      console.log('🚀 SpotBulle IA démarré avec succès!');
      console.log('🎉 ================================');
      console.log(`🌍 URL: http://localhost:${PORT}`);
      console.log(`🔧 Environnement: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📡 Health check: http://localhost:${PORT}/health`);
      console.log(`🤖 API IA: http://localhost:${PORT}/api/ia`);
      console.log(`🎨 Frontend: ${frontendBuilt ? 'Intégré' : 'Mode fallback'}`);
      console.log(`💾 Base de données: ${dbConnected ? 'Connectée' : 'Mode dégradé'}`);
      console.log(`📦 Taille max uploads: 250MB`);
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

