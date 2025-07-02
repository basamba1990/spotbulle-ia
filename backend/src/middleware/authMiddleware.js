// backend/src/middleware/authMiddleware.js - VERSION CORRIGÉE
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware d'authentification amélioré
const authenticateToken = async (req, res, next) => {
  try {
    // Récupérer le token depuis différentes sources
    let token = null;
    
    // 1. Header Authorization (Bearer token)
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
    
    // 2. Header x-access-token
    if (!token && req.headers['x-access-token']) {
      token = req.headers['x-access-token'];
    }
    
    // 3. Cookie (pour les requêtes web)
    if (!token && req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }
    
    // 4. Query parameter (pour certains cas spéciaux)
    if (!token && req.query.token) {
      token = req.query.token;
    }
    
    if (!token) {
      console.log('❌ Aucun token fourni pour:', req.path);
      return res.status(401).json({
        success: false,
        message: 'Token d\'accès requis',
        error: 'NO_TOKEN',
        path: req.path
      });
    }
    
    // Vérifier et décoder le token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      console.log('❌ Token invalide:', jwtError.message);
      
      // Gestion spécifique des erreurs JWT
      let errorMessage = 'Token invalide';
      let errorCode = 'INVALID_TOKEN';
      
      if (jwtError.name === 'TokenExpiredError') {
        errorMessage = 'Token expiré';
        errorCode = 'TOKEN_EXPIRED';
      } else if (jwtError.name === 'JsonWebTokenError') {
        errorMessage = 'Format de token invalide';
        errorCode = 'MALFORMED_TOKEN';
      } else if (jwtError.name === 'NotBeforeError') {
        errorMessage = 'Token pas encore valide';
        errorCode = 'TOKEN_NOT_ACTIVE';
      }
      
      return res.status(401).json({
        success: false,
        message: errorMessage,
        error: errorCode,
        path: req.path
      });
    }
    
    // Vérifier que le token contient les informations nécessaires
    if (!decoded.userId) {
      console.log('❌ Token sans userId');
      return res.status(401).json({
        success: false,
        message: 'Token invalide - informations manquantes',
        error: 'INCOMPLETE_TOKEN',
        path: req.path
      });
    }
    
    // Récupérer l'utilisateur depuis la base de données
    let user;
    try {
      user = await User.findByPk(decoded.userId, {
        attributes: ['id', 'email', 'nom', 'prenom', 'role', 'statut', 'date_creation']
      });
    } catch (dbError) {
      console.error('❌ Erreur DB lors de la récupération utilisateur:', dbError);
      return res.status(500).json({
        success: false,
        message: 'Erreur de base de données',
        error: 'DATABASE_ERROR',
        path: req.path
      });
    }
    
    if (!user) {
      console.log('❌ Utilisateur non trouvé pour ID:', decoded.userId);
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non trouvé',
        error: 'USER_NOT_FOUND',
        path: req.path
      });
    }
    
    // Vérifier le statut de l'utilisateur
    if (user.statut === 'suspendu') {
      console.log('❌ Utilisateur suspendu:', user.id);
      return res.status(403).json({
        success: false,
        message: 'Compte suspendu',
        error: 'ACCOUNT_SUSPENDED',
        path: req.path
      });
    }
    
    if (user.statut === 'inactif') {
      console.log('❌ Utilisateur inactif:', user.id);
      return res.status(403).json({
        success: false,
        message: 'Compte inactif',
        error: 'ACCOUNT_INACTIVE',
        path: req.path
      });
    }
    
    // Ajouter les informations utilisateur à la requête
    req.user = {
      id: user.id,
      email: user.email,
      nom: user.nom,
      prenom: user.prenom,
      role: user.role,
      statut: user.statut,
      tokenData: decoded
    };
    
    console.log(`✅ Authentification réussie pour: ${user.email} (${req.path})`);
    next();
    
  } catch (error) {
    console.error('❌ Erreur dans le middleware d\'authentification:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur interne d\'authentification',
      error: 'AUTH_MIDDLEWARE_ERROR',
      path: req.path,
      ...(process.env.NODE_ENV === 'development' && { details: error.message })
    });
  }
};

// Middleware d'authentification optionnel (n'échoue pas si pas de token)
const optionalAuth = async (req, res, next) => {
  try {
    // Essayer d'authentifier, mais continuer même si ça échoue
    await authenticateToken(req, res, (error) => {
      if (error) {
        // En cas d'erreur, continuer sans utilisateur authentifié
        req.user = null;
      }
      next();
    });
  } catch (error) {
    // En cas d'erreur, continuer sans utilisateur authentifié
    req.user = null;
    next();
  }
};

// Middleware de vérification des rôles
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise',
        error: 'AUTHENTICATION_REQUIRED'
      });
    }
    
    // Convertir en tableau si c'est une chaîne
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    
    if (!allowedRoles.includes(req.user.role)) {
      console.log(`❌ Accès refusé - Rôle requis: ${allowedRoles.join(', ')}, Rôle utilisateur: ${req.user.role}`);
      return res.status(403).json({
        success: false,
        message: 'Permissions insuffisantes',
        error: 'INSUFFICIENT_PERMISSIONS',
        required: allowedRoles,
        current: req.user.role
      });
    }
    
    next();
  };
};

// Middleware de vérification de propriété (pour les ressources utilisateur)
const requireOwnership = (getResourceUserId) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise',
        error: 'AUTHENTICATION_REQUIRED'
      });
    }
    
    try {
      // Récupérer l'ID du propriétaire de la ressource
      const resourceUserId = await getResourceUserId(req);
      
      // Vérifier si l'utilisateur est le propriétaire ou un admin
      if (req.user.id !== resourceUserId && req.user.role !== 'admin') {
        console.log(`❌ Accès refusé - Propriétaire requis. User: ${req.user.id}, Resource owner: ${resourceUserId}`);
        return res.status(403).json({
          success: false,
          message: 'Accès non autorisé à cette ressource',
          error: 'RESOURCE_ACCESS_DENIED'
        });
      }
      
      next();
    } catch (error) {
      console.error('❌ Erreur lors de la vérification de propriété:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la vérification des permissions',
        error: 'OWNERSHIP_CHECK_ERROR'
      });
    }
  };
};

// Middleware de limitation de taux par utilisateur
const userRateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const userRequests = new Map();
  
  return (req, res, next) => {
    if (!req.user) {
      return next(); // Pas de limitation si pas d'utilisateur
    }
    
    const userId = req.user.id;
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Nettoyer les anciennes entrées
    if (userRequests.has(userId)) {
      const requests = userRequests.get(userId).filter(time => time > windowStart);
      userRequests.set(userId, requests);
    } else {
      userRequests.set(userId, []);
    }
    
    const requests = userRequests.get(userId);
    
    if (requests.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: 'Trop de requêtes, veuillez ralentir',
        error: 'USER_RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
    
    requests.push(now);
    next();
  };
};

// Exporter les middlewares avec les noms corrects
module.exports = {
  authenticateToken,
  optionalAuth,
  requireRole,
  requireOwnership,
  userRateLimit,
  // Alias pour compatibilité avec le code existant
  authMiddleware: authenticateToken
};

