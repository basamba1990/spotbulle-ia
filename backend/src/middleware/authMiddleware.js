const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Vérification de la présence du JWT_SECRET au démarrage
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET manquant dans les variables d\'environnement');
}

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Accès refusé. Format de token invalide.'
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Vérification de l'expiration du token
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp && decoded.exp < now) {
      return res.status(401).json({
        success: false,
        message: 'Token expiré.'
      });
    }

    const user = await User.findByPk(decoded.userId, {
      attributes: ['id', 'email', 'nom', 'prenom', 'bio', 'statut', 'role', 'derniere_connexion']
    });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token invalide. Utilisateur introuvable.'
      });
    }

    if (user.statut !== 'actif') {
      return res.status(403).json({
        success: false,
        message: 'Compte utilisateur inactif ou suspendu.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token invalide.'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expiré.'
      });
    }

    console.error('Erreur middleware auth:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la vérification du token.'
    });
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Vérification de l'expiration
      const now = Math.floor(Date.now() / 1000);
      if (decoded.exp && decoded.exp >= now) {
        const user = await User.findByPk(decoded.userId, {
          attributes: ['id', 'email', 'nom', 'prenom', 'bio', 'statut', 'role']
        });
        
        if (user && user.statut === 'actif') {
          req.user = user;
        }
      }
    }
    
    next();
  } catch (error) {
    // Ignorer les erreurs d'authentification pour ce middleware optionnel
    next();
  }
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise.'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Permissions insuffisantes.',
        requiredRoles: roles,
        userRole: req.user.role
      });
    }

    next();
  };
};

module.exports = {
  authMiddleware,
  optionalAuth,
  requireRole
};
