const express = require('express');
const { body } = require('express-validator');
const aiController = require('../controllers/aiController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Toutes les routes nécessitent une authentification
router.use(authMiddleware);

/**
 * @route POST /api/ai/analyze/:id
 * @desc Déclencher l'analyse IA d'une vidéo
 * @access Private (propriétaire ou admin)
 */
router.post('/analyze/:id', aiController.analyzeVideo);

/**
 * @route GET /api/ai/status/:id
 * @desc Obtenir le statut de l'analyse IA d'une vidéo
 * @access Private
 */
router.get('/status/:id', aiController.getAnalysisStatus);

/**
 * @route GET /api/ai/similar/:id
 * @desc Obtenir les projets similaires à une vidéo
 * @access Private
 */
router.get('/similar/:id', aiController.getSimilarProjects);

/**
 * @route GET /api/ai/search
 * @desc Rechercher des vidéos par mots-clés IA
 * @access Private
 * @query keywords - Mots-clés séparés par des virgules
 * @query page - Numéro de page (défaut: 1)
 * @query limit - Nombre d'éléments par page (défaut: 10)
 */
router.get('/search', aiController.searchByKeywords);

/**
 * @route GET /api/ai/analytics
 * @desc Obtenir les statistiques d'analyse IA
 * @access Private
 */
router.get('/analytics', aiController.getAnalyticsStats);

module.exports = router;

