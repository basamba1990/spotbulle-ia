const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Accès refusé. Token manquant.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.userId);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token invalide. Utilisateur introuvable.'
      });
    }

    if (user.statut !== 'actif') {
      return res.status(401).json({
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
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findByPk(decoded.userId);
      
      if (user && user.statut === 'actif') {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // En cas d'erreur, on continue sans utilisateur authentifié
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

    // Pour l'instant, on considère que tous les utilisateurs ont le rôle 'user'
    // Cette logique peut être étendue avec un système de rôles plus complexe
    const userRole = req.user.role || 'user';
    
    if (!roles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Permissions insuffisantes.'
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

