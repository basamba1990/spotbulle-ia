const express = require("express");
const { body, query } = require("express-validator");
const eventController = require("../controllers/eventController");
const { authMiddleware, optionalAuth } = require("../middleware/authMiddleware");

const router = express.Router();

// Validation pour la création/mise à jour d'événement
const eventValidation = [
  body("nom")
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage("Le nom doit contenir entre 3 et 100 caractères"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage("La description ne peut pas dépasser 2000 caractères"),
  body("date_debut")
    .isISO8601()
    .withMessage("Date de début invalide")
    .custom((value) => {
      if (new Date(value) < new Date()) {
        throw new Error("La date de début ne peut pas être dans le passé");
      }
      return true;
    }),
  body("date_fin")
    .optional()
    .isISO8601()
    .withMessage("Date de fin invalide")
    .custom((value, { req }) => {
      if (value && req.body.date_debut && new Date(value) <= new Date(req.body.date_debut)) {
        throw new Error("La date de fin doit être après la date de début");
      }
      return true;
    }),
  body("lieu")
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage("Le lieu ne peut pas dépasser 200 caractères"),
  body("thematique")
    .isIn(["sport", "culture", "education", "famille", "professionnel", "loisirs", "voyage", "cuisine", "technologie", "sante", "autre"])
    .withMessage("Thématique invalide"),
  body("image_url")
    .optional()
    .isURL()
    .withMessage("URL d'image invalide"),
  body("capacite_max")
    .optional()
    .isInt({ min: 1 })
    .withMessage("La capacité maximale doit être un entier positif"),
  body("prix")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Le prix doit être un nombre positif"),
  body("tags")
    .optional()
    .isArray()
    .withMessage("Les tags doivent être un tableau"),
  body("tags.*")
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage("Chaque tag doit contenir entre 1 et 50 caractères"),
  body("coordonnees")
    .optional()
    .isObject()
    .withMessage("Les coordonnées doivent être un objet"),
  body("coordonnees.lat")
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage("Latitude invalide"),
  body("coordonnees.lng")
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage("Longitude invalide"),
  body("parametres")
    .optional()
    .isObject()
    .withMessage("Les paramètres doivent être un objet")
];

// Validation pour les filtres de recherche
const searchValidation = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("La page doit être un entier positif"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage("La limite doit être entre 1 et 50"),
  query("thematique")
    .optional()
    .isIn(["sport", "culture", "education", "famille", "professionnel", "loisirs", "voyage", "cuisine", "technologie", "sante", "autre"])
    .withMessage("Thématique invalide"),
  query("statut")
    .optional()
    .isIn(["planifie", "en_cours", "termine", "annule"])
    .withMessage("Statut invalide"),
  query("date_debut")
    .optional()
    .isISO8601()
    .withMessage("Date de début invalide"),
  query("date_fin")
    .optional()
    .isISO8601()
    .withMessage("Date de fin invalide"),
  query("lieu")
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage("Le lieu ne peut pas être vide"),
  query("search")
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage("Le terme de recherche doit contenir au moins 2 caractères")
];

// Validation pour la participation
const participationValidation = [
  body("commentaire")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Le commentaire ne peut pas dépasser 500 caractères")
];

// Routes publiques (avec authentification optionnelle)
router.get("/", optionalAuth, searchValidation, eventController.getEvents);
router.get("/:id", optionalAuth, eventController.getEventById);
router.get("/:id/videos", optionalAuth, eventController.getEventVideos);

// Routes protégées
router.post("/", authMiddleware, eventValidation, eventController.createEvent);
router.put("/:id", authMiddleware, eventValidation, eventController.updateEvent);
router.delete("/:id", authMiddleware, eventController.deleteEvent);

router.post("/:id/join", authMiddleware, participationValidation, eventController.joinEvent);

module.exports = router;


