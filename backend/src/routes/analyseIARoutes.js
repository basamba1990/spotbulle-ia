const express = require('express');
const { param, query } = require('express-validator');
const analyseIAController = require('../controllers/analyseIAController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

// Validation pour les paramètres UUID
const uuidValidation = [
  param('videoId')
    .isUUID()
    .withMessage('ID de vidéo invalide')
];

// Validation pour la recherche de similarité
const similariteValidation = [
  ...uuidValidation,
  query('limit')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('La limite doit être entre 1 et 20')
];

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
 * @desc Recherche des vidéos similaires basée sur l'IA
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

module.exports = router;

