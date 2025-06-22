const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { connectDB } = require('./config/db');

// Charger les variables d'environnement
dotenv.config();

const app = express();

// Middleware CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Middleware pour parser JSON
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Connexion à la base de données
connectDB();

// Routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const videoRoutes = require('./routes/videoRoutes');
const eventRoutes = require('./routes/eventRoutes');
const aiRoutes = require('./routes/aiRoutes'); // Nouvelle route IA

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/ai', aiRoutes); // Nouvelle route IA

// Route de test
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'SpotBulle IA API is running',
    timestamp: new Date().toISOString(),
    features: {
      ai_analysis: !!(process.env.OPENAI_API_KEY && process.env.ASSEMBLYAI_API_KEY),
      video_upload: !!process.env.SUPABASE_URL
    }
  });
});

// Middleware de gestion d'erreurs
app.use((err, req, res, next) => {
  console.error('Erreur serveur:', err);
  
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      message: 'Fichier trop volumineux'
    });
  }
  
  res.status(500).json({
    success: false,
    message: 'Erreur interne du serveur'
  });
});

// Route 404
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route non trouvée'
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Serveur SpotBulle IA démarré sur le port ${PORT}`);
  console.log(`📊 Fonctionnalités IA: ${!!(process.env.OPENAI_API_KEY && process.env.ASSEMBLYAI_API_KEY) ? 'Activées' : 'Désactivées'}`);
  console.log(`📁 Upload vidéo: ${!!process.env.SUPABASE_URL ? 'Activé' : 'Désactivé'}`);
});

module.exports = app;

