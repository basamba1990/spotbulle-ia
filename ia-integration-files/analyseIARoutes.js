const express = require("express");
const { param, query } = require("express-validator");
const AnalyseIAService = require("../services/analyseIAService");
const MiseEnCorrespondanceService = require("../services/miseEnCorrespondanceService");
const AnalyseIAController = require("../controllers/analyseIAController");
const MiseEnCorrespondanceController = require("../controllers/miseEnCorrespondanceController");
const { authMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();

// Instancier les services
const analyseIAServiceInstance = new AnalyseIAService();
const miseEnCorrespondanceServiceInstance = new MiseEnCorrespondanceService();

// Instancier les contrôleurs avec les services injectés
const analyseIAControllerInstance = new AnalyseIAController(analyseIAServiceInstance);
const miseEnCorrespondanceControllerInstance = new MiseEnCorrespondanceController(miseEnCorrespondanceServiceInstance);

// Validation pour les paramètres UUID
const uuidValidation = [
    param("videoId").isUUID().withMessage("ID de vidéo invalide"),
];

// Validation pour deux UUIDs
const doubleUuidValidation = [
    param("videoId1").isUUID().withMessage("Premier ID de vidéo invalide"),
    param("videoId2").isUUID().withMessage("Deuxième ID de vidéo invalide"),
];

// Validation pour la recherche de similarité
const similariteValidation = [
    ...uuidValidation,
    query("limit")
        .optional()
        .isInt({ min: 1, max: 20 })
        .withMessage("La limite doit être entre 1 et 20"),
    query("score_minimum")
        .optional()
        .isFloat({ min: 0, max: 1 })
        .withMessage("Le score minimum doit être entre 0 et 1"),
    query("thematique")
        .optional()
        .isIn([
            "sport",
            "culture",
            "education",
            "professionnel",
            "loisirs",
            "voyage",
            "technologie",
            "art",
            "musique",
            "cuisine",
            "mode",
            "science",
            "histoire",
            "nature",
            "gaming",
            "automobile",
            "finance",
            "sante",
            "bien-etre",
            "humour",
            "actualite",
            "documentaire",
            "autre"
        ])
        .withMessage("Thématique invalide"),
    query("inclure_utilisateur")
        .optional()
        .isBoolean()
        .withMessage("Le paramètre inclure_utilisateur doit être un booléen"),
];

// Routes d'analyse IA
router.post("/videos/:videoId/analyser", authMiddleware, uuidValidation, analyseIAControllerInstance.lancerAnalyse);
router.get("/videos/:videoId/resultats", authMiddleware, uuidValidation, analyseIAControllerInstance.getResultatsAnalyse);
router.get("/statistiques", authMiddleware, analyseIAControllerInstance.getStatistiquesIA);

// Routes de mise en correspondance
router.get("/projets/:videoId/similaires", authMiddleware, similariteValidation, miseEnCorrespondanceControllerInstance.rechercherProjetsSimilaires);
router.get("/recommandations", authMiddleware, miseEnCorrespondanceControllerInstance.getRecommandations);
router.get("/projets/:videoId/collaborateurs", authMiddleware, uuidValidation, miseEnCorrespondanceControllerInstance.rechercherCollaborateurs);
router.get("/projets/:videoId1/compatibilite/:videoId2", authMiddleware, doubleUuidValidation, miseEnCorrespondanceControllerInstance.calculerCompatibilite);

module.exports = router;


