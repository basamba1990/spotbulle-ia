const express = require('express');
const { body, query } = require('express-validator');
const videoController = require('../controllers/videoController');
const { authMiddleware, optionalAuth } = require('../middlewares/authMiddleware');

const router = express.Router();

// Validation pour l'upload de vidéo
const uploadValidation = [
  body('titre')
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Le titre doit contenir entre 3 et 200 caractères'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('La description ne peut pas dépasser 2000 caractères'),
  body('thematique')
    .isIn(['sport', 'culture', 'education', 'famille', 'professionnel', 'loisirs', 'voyage', 'cuisine', 'technologie', 'sante', 'autre'])
    .withMessage('Thématique invalide'),
  body('tags')
    .optional()
    .custom((value) => {
      if (value) {
        try {
          const tags = JSON.parse(value);
          if (!Array.isArray(tags)) {
            throw new Error('Les tags doivent être un tableau');
          }
          if (tags.length > 10) {
            throw new Error('Maximum 10 tags autorisés');
          }
          for (const tag of tags) {
            if (typeof tag !== 'string' || tag.trim().length === 0 || tag.length > 50) {
              throw new Error('Chaque tag doit être une chaîne non vide de maximum 50 caractères');
            }
          }
        } catch (e) {
          throw new Error('Format de tags invalide');
        }
      }
      return true;
    }),
  body('evenement_id')
    .optional()
    .isUUID()
    .withMessage('ID d\'événement invalide'),
  body('parametres_confidentialite')
    .optional()
    .custom((value) => {
      if (value) {
        try {
          const params = JSON.parse(value);
          if (typeof params !== 'object') {
            throw new Error('Les paramètres de confidentialité doivent être un objet');
          }
        } catch (e) {
          throw new Error('Format de paramètres de confidentialité invalide');
        }
      }
      return true;
    })
];

// Validation pour la mise à jour de vidéo
const updateValidation = [
  body('titre')
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Le titre doit contenir entre 3 et 200 caractères'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('La description ne peut pas dépasser 2000 caractères'),
  body('thematique')
    .optional()
    .isIn(['sport', 'culture', 'education', 'famille', 'professionnel', 'loisirs', 'voyage', 'cuisine', 'technologie', 'sante', 'autre'])
    .withMessage('Thématique invalide'),
  body('tags')
    .optional()
    .isArray({ max: 10 })
    .withMessage('Maximum 10 tags autorisés'),
  body('tags.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Chaque tag doit contenir entre 1 et 50 caractères'),
  body('parametres_confidentialite')
    .optional()
    .isObject()
    .withMessage('Les paramètres de confidentialité doivent être un objet'),
  body('parametres_confidentialite.public')
    .optional()
    .isBoolean()
    .withMessage('Le paramètre public doit être un booléen'),
  body('parametres_confidentialite.commentaires_autorises')
    .optional()
    .isBoolean()
    .withMessage('Le paramètre commentaires autorisés doit être un booléen'),
  body('parametres_confidentialite.telechargement_autorise')
    .optional()
    .isBoolean()
    .withMessage('Le paramètre téléchargement autorisé doit être un booléen')
];

// Validation pour les filtres de recherche
const searchValidation = [
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
  query('user_id')
    .optional()
    .isUUID()
    .withMessage('ID utilisateur invalide'),
  query('evenement_id')
    .optional()
    .isUUID()
    .withMessage('ID événement invalide'),
  query('search')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Le terme de recherche doit contenir au moins 2 caractères'),
  query('sort')
    .optional()
    .isIn(['recent', 'popular', 'oldest'])
    .withMessage('Tri invalide (recent, popular, oldest)')
];

// Validation pour le like
const likeValidation = [
  body('action')
    .isIn(['like', 'unlike'])
    .withMessage('Action invalide (like ou unlike)')
];

// Middleware de gestion d'erreur pour l'upload
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'Fichier trop volumineux (maximum 100MB)'
      });
    }
  }
  
  if (error.message === 'Type de fichier non autorisé') {
    return res.status(400).json({
      success: false,
      message: 'Type de fichier non autorisé. Formats acceptés: MP4, AVI, MOV, WMV, WebM'
    });
  }
  
  next(error);
};

// Routes publiques (avec authentification optionnelle)
router.get('/', optionalAuth, searchValidation, videoController.getVideos);
router.get('/:id', optionalAuth, videoController.getVideoById);

// Routes protégées
router.post('/upload', 
  authMiddleware, 
  videoController.uploadMiddleware,
  handleUploadError,
  uploadValidation, 
  videoController.uploadVideo
);
router.put('/:id', authMiddleware, updateValidation, videoController.updateVideo);
router.delete('/:id', authMiddleware, videoController.deleteVideo);
router.post('/:id/like', authMiddleware, likeValidation, videoController.toggleLike);

module.exports = router;

