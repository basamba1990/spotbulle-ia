// backend/src/server-simple.js - Version simplifiée pour tests et déploiement
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 10000;

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

// Route de santé
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Serveur SpotBulle opérationnel',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Routes API de base (simulées pour les tests)
app.get('/api/auth/me', (req, res) => {
  res.status(401).json({ success: false, message: 'Non authentifié' });
});

app.post('/api/auth/login', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Connexion simulée réussie',
    user: { id: '123', email: 'test@example.com', nom: 'Utilisateur Test' },
    token: 'fake-jwt-token'
  });
});

app.post('/api/auth/register', (req, res) => {
  res.status(201).json({
    success: true,
    message: 'Inscription simulée réussie',
    user: { id: '124', email: req.body.email, nom: req.body.nom },
    token: 'fake-jwt-token'
  });
});

app.get('/api/videos', (req, res) => {
  res.status(200).json({
    success: true,
    videos: [
      {
        id: '1',
        titre: 'Pitch Exemple 1',
        description: 'Description du pitch exemple',
        url_video: 'https://example.com/video1.mp4',
        vues: 150,
        likes: 12
      },
      {
        id: '2',
        titre: 'Pitch Exemple 2',
        description: 'Autre description de pitch',
        url_video: 'https://example.com/video2.mp4',
        vues: 89,
        likes: 7
      }
    ]
  });
});

app.get('/api/events', (req, res) => {
  res.status(200).json({
    success: true,
    events: [
      {
        id: '1',
        titre: 'Concours Startup 2025',
        description: 'Grand concours de startups innovantes',
        date_debut: '2025-07-01',
        statut: 'planifie'
      }
    ]
  });
});

app.get('/api/users/:id/stats', (req, res) => {
  res.status(200).json({
    success: true,
    stats: {
      videos_count: 3,
      total_vues: 245,
      total_likes: 19,
      events_organises: 1
    }
  });
});

app.get('/api/users/:id/videos', (req, res) => {
  res.status(200).json({
    success: true,
    videos: []
  });
});

app.get('/ia/recommandations', (req, res) => {
  res.status(401).json({ success: false, message: 'Authentification requise pour les recommandations IA' });
});

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
  
  // Servir une page HTML simple avec le frontend intégré
  res.status(200).send(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>SpotBulle IA - Plateforme de partage vidéo</title>
      <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
      <style>
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; }
        .gradient-bg { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
        .card { backdrop-filter: blur(10px); background: rgba(255, 255, 255, 0.1); }
      </style>
    </head>
    <body class="bg-gray-50">
      <!-- Navigation -->
      <nav class="gradient-bg text-white shadow-lg">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between h-16">
            <div class="flex items-center">
              <h1 class="text-xl font-bold">🚀 SpotBulle IA</h1>
            </div>
            <div class="flex items-center space-x-4">
              <a href="/login" class="hover:bg-white hover:bg-opacity-20 px-3 py-2 rounded-md">Connexion</a>
              <a href="/register" class="bg-white text-purple-600 px-4 py-2 rounded-md font-medium hover:bg-gray-100">Inscription</a>
            </div>
          </div>
        </div>
      </nav>

      <!-- Contenu principal -->
      <main class="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <!-- Hero Section -->
        <div class="text-center mb-12">
          <h1 class="text-4xl font-bold text-gray-900 mb-4">
            Plateforme de partage vidéo avec IA
          </h1>
          <p class="text-xl text-gray-600 mb-8">
            Partagez vos pitchs, analysez-les avec l'intelligence artificielle et connectez-vous avec des entrepreneurs
          </p>
          <div class="space-x-4">
            <a href="/upload" class="bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors">
              Télécharger une vidéo
            </a>
            <a href="/ia" class="border border-purple-600 text-purple-600 px-6 py-3 rounded-lg font-medium hover:bg-purple-50 transition-colors">
              Analyse IA
            </a>
          </div>
        </div>

        <!-- Fonctionnalités -->
        <div class="grid md:grid-cols-3 gap-8 mb-12">
          <div class="card p-6 rounded-xl border border-gray-200">
            <div class="text-3xl mb-4">🎥</div>
            <h3 class="text-lg font-semibold mb-2">Partage de vidéos</h3>
            <p class="text-gray-600">Téléchargez et partagez vos pitchs vidéo avec la communauté</p>
          </div>
          <div class="card p-6 rounded-xl border border-gray-200">
            <div class="text-3xl mb-4">🤖</div>
            <h3 class="text-lg font-semibold mb-2">Analyse IA</h3>
            <p class="text-gray-600">Obtenez des analyses automatiques de vos pitchs avec l'IA</p>
          </div>
          <div class="card p-6 rounded-xl border border-gray-200">
            <div class="text-3xl mb-4">🌟</div>
            <h3 class="text-lg font-semibold mb-2">Événements</h3>
            <p class="text-gray-600">Participez à des concours et événements entrepreneuriaux</p>
          </div>
        </div>

        <!-- État du serveur -->
        <div class="bg-green-50 border border-green-200 rounded-lg p-4">
          <div class="flex items-center">
            <div class="text-green-500 text-xl mr-3">✅</div>
            <div>
              <h3 class="text-green-800 font-medium">Serveur opérationnel</h3>
              <p class="text-green-600 text-sm">
                Backend API fonctionnel • Frontend intégré • Prêt pour le déploiement
              </p>
            </div>
          </div>
        </div>
      </main>

      <!-- Footer -->
      <footer class="bg-gray-800 text-white py-8 mt-12">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p>&copy; 2025 SpotBulle IA. Plateforme de partage vidéo avec intelligence artificielle.</p>
          <div class="mt-4 space-x-4">
            <a href="/api" class="text-gray-300 hover:text-white">API Documentation</a>
            <a href="/health" class="text-gray-300 hover:text-white">État du serveur</a>
          </div>
        </div>
      </footer>

      <script>
        // Vérification de l'état du serveur
        fetch('/health')
          .then(response => response.json())
          .then(data => {
            console.log('✅ Serveur opérationnel:', data);
          })
          .catch(error => {
            console.error('❌ Erreur serveur:', error);
          });

        // Simulation d'interactions
        document.addEventListener('DOMContentLoaded', function() {
          console.log('🚀 SpotBulle IA chargé avec succès');
        });
      </script>
    </body>
    </html>
  `);
});

// Route API par défaut
app.get('/api', (req, res) => {
  res.json({
    message: 'API SpotBulle - Plateforme de partage vidéo avec IA',
    version: '1.1.0',
    status: 'operational',
    endpoints: {
      health: '/health',
      auth: '/api/auth (login, register, me)',
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
    note: 'Version simplifiée pour tests et déploiement. Base de données complète disponible en production.'
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

// Démarrer le serveur
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Serveur SpotBulle démarré sur le port ${PORT}`);
  console.log(`🌍 Environnement: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`🎨 Frontend intégré: http://localhost:${PORT}/`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/api`);
  console.log(`✨ Version simplifiée - Prêt pour le déploiement !`);
});

// Gestion des signaux de fermeture
process.on('SIGTERM', () => {
  console.log('🛑 Signal SIGTERM reçu, fermeture du serveur...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Signal SIGINT reçu, fermeture du serveur...');
  process.exit(0);
});

