const express = require('express');
const { body, query } = require('express-validator');
const userController = require('../controllers/userController');
const { authenticateToken, optionalAuth } = require("../middleware/authMiddleware");

const router = express.Router();

// Validation pour la mise à jour du profil
const updateProfileValidation = [
  body('nom')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Le nom doit contenir entre 2 et 50 caractères'),
  body('prenom')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Le prénom doit contenir entre 2 et 50 caractères'),
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('La bio ne peut pas dépasser 500 caractères'),
  body('preferences')
    .optional()
    .isObject()
    .withMessage('Les préférences doivent être un objet'),
  body('preferences.notifications')
    .optional()
    .isBoolean()
    .withMessage('La préférence notifications doit être un booléen'),
  body('preferences.public_profile')
    .optional()
    .isBoolean()
    .withMessage('La préférence profil public doit être un booléen'),
  body('preferences.theme')
    .optional()
    .isIn(['light', 'dark'])
    .withMessage('Le thème doit être "light" ou "dark"')
];

// Validation pour la recherche
const searchValidation = [
  query('q')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Le terme de recherche doit contenir au moins 2 caractères'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('La page doit être un entier positif'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('La limite doit être entre 1 et 50')
];

// Validation pour la pagination
const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('La page doit être un entier positif'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('La limite doit être entre 1 et 50'),
  query('thematique')
    .optional()
    .isIn(['sport', 'culture', 'education', 'famille', 'professionnel', 'loisirs', 'voyage', 'cuisine', 'technologie', 'sante', 'autre'])
    .withMessage('Thématique invalide'),
  query('statut')
    .optional()
    .isIn(['en_traitement', 'actif', 'inactif', 'supprime', 'modere'])
    .withMessage('Statut invalide')
];

// Routes publiques (avec authentification optionnelle)
router.get('/search', optionalAuth, searchValidation, userController.searchUsers);
router.get('/:id', optionalAuth, userController.getProfile);
router.get('/:id/videos', optionalAuth, paginationValidation, userController.getUserVideos);
router.get('/:id/stats', optionalAuth, userController.getUserStats);

// Routes protégées
router.put("/profile", authenticateToken, ...updateProfileValidation, userController.updateProfile);

module.exports = router;



console.log('Debug: authenticateToken type:', typeof authenticateToken);
console.log('Debug: updateProfileValidation type:', typeof updateProfileValidation, Array.isArray(updateProfileValidation));
console.log('Debug: userController.updateProfile type:', typeof userController.updateProfile);


