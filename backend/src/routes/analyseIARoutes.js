const express = require('express');
const { param, query } = require('express-validator');
const analyseIAController = require('../controllers/analyseIAController');
const miseEnCorrespondanceController = require('../controllers/miseEnCorrespondanceController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

// Validation pour les paramètres UUID
const uuidValidation = [
  param('videoId')
    .isUUID()
    .withMessage('ID de vidéo invalide')
];

// Validation pour deux UUIDs
const doubleUuidValidation = [
  param('videoId1')
    .isUUID()
    .withMessage('Premier ID de vidéo invalide'),
  param('videoId2')
    .isUUID()
    .withMessage('Deuxième ID de vidéo invalide')
];

// Validation pour la recherche de similarité
const similariteValidation = [
  ...uuidValidation,
  query('limit')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('La limite doit être entre 1 et 20'),
  query('score_minimum')
    .optional()
    .isFloat({ min: 0, max: 1 })
    .withMessage('Le score minimum doit être entre 0 et 1'),
  query('thematique')
    .optional()
    .isIn(['sport', 'culture', 'education', 'famille', 'professionnel', 'loisirs', 'voyage', 'cuisine', 'technologie', 'sante', 'autre'])
    .withMessage('Thématique invalide'),
  query('inclure_utilisateur')
    .optional()
    .isBoolean()
    .withMessage('inclure_utilisateur doit être un booléen')
];

// Validation pour les recommandations
const recommendationValidation = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('La limite doit être entre 1 et 50'),
  query('score_minimum')
    .optional()
    .isFloat({ min: 0, max: 1 })
    .withMessage('Le score minimum doit être entre 0 et 1'),
  query('thematiques')
    .optional()
    .custom((value) => {
      if (value) {
        const thematiques = value.split(',');
        const themesValides = ['sport', 'culture', 'education', 'famille', 'professionnel', 'loisirs', 'voyage', 'cuisine', 'technologie', 'sante', 'autre'];
        return thematiques.every(theme => themesValides.includes(theme.trim()));
      }
      return true;
    })
    .withMessage('Thématiques invalides')
];

// ===== ROUTES D'ANALYSE IA =====

/**
 * @route POST /api/ia/videos/:videoId/analyser
 * @desc Lance l'analyse IA d'une vidéo
 * @access Privé (utilisateur authentifié)
 */
router.post('/videos/:videoId/analyser', 
  authMiddleware, 
  uuidValidation, 
  analyseIAController.lancerAnalyse
);

/**
 * @route GET /api/ia/videos/:videoId/resultats
 * @desc Récupère les résultats de l'analyse IA d'une vidéo
 * @access Privé (utilisateur authentifié)
 */
router.get('/videos/:videoId/resultats', 
  authMiddleware, 
  uuidValidation, 
  analyseIAController.obtenirResultatsAnalyse
);

/**
 * @route GET /api/ia/videos/:videoId/similaires
 * @desc Recherche des vidéos similaires basée sur l'IA (ancienne route, maintenue pour compatibilité)
 * @access Privé (utilisateur authentifié)
 */
router.get('/videos/:videoId/similaires', 
  authMiddleware, 
  similariteValidation, 
  analyseIAController.rechercherVideosSimilaires
);

/**
 * @route GET /api/ia/statistiques
 * @desc Obtient des statistiques sur l'analyse IA pour l'utilisateur
 * @access Privé (utilisateur authentifié)
 */
router.get('/statistiques', 
  authMiddleware, 
  analyseIAController.obtenirStatistiquesIA
);

// ===== ROUTES DE MISE EN CORRESPONDANCE =====

/**
 * @route GET /api/ia/projets/:videoId/similaires
 * @desc Recherche des projets similaires à une vidéo donnée
 * @access Privé (utilisateur authentifié)
 */
router.get('/projets/:videoId/similaires', 
  authMiddleware, 
  similariteValidation, 
  miseEnCorrespondanceController.rechercherProjetsSimilaires
);

/**
 * @route GET /api/ia/recommandations
 * @desc Génère des recommandations de projets pour l'utilisateur connecté
 * @access Privé (utilisateur authentifié)
 */
router.get('/recommandations', 
  authMiddleware, 
  recommendationValidation, 
  miseEnCorrespondanceController.recommanderProjets
);

/**
 * @route GET /api/ia/projets/:videoId/collaborateurs
 * @desc Trouve des collaborateurs potentiels pour un projet
 * @access Privé (utilisateur authentifié)
 */
router.get('/projets/:videoId/collaborateurs', 
  authMiddleware, 
  similariteValidation, 
  miseEnCorrespondanceController.trouverCollaborateurs
);

/**
 * @route GET /api/ia/projets/:videoId1/compatibilite/:videoId2
 * @desc Évalue la compatibilité entre deux projets
 * @access Privé (utilisateur authentifié)
 */
router.get('/projets/:videoId1/compatibilite/:videoId2', 
  authMiddleware, 
  doubleUuidValidation, 
  miseEnCorrespondanceController.evaluerCompatibilite
);

/**
 * @route GET /api/ia/recherche/avancee
 * @desc Recherche avancée de projets avec filtres multiples
 * @access Privé (utilisateur authentifié)
 */
router.get('/recherche/avancee', 
  authMiddleware, 
  miseEnCorrespondanceController.rechercheAvancee
);

/**
 * @route GET /api/ia/statistiques/correspondance
 * @desc Obtient des statistiques sur les correspondances et recommandations
 * @access Privé (utilisateur authentifié)
 */
router.get('/statistiques/correspondance', 
  authMiddleware, 
  miseEnCorrespondanceController.obtenirStatistiquesCorrespondance
);

module.exports = router;

