const MiseEnCorrespondanceService = require("../services/miseEnCorrespondanceService");
const { validationResult } = require("express-validator");

class MiseEnCorrespondanceController {
    constructor(correspondanceService) {
        this.correspondanceService = correspondanceService;
    }

    /**
     * Recherche des projets similaires à une vidéo donnée
     */
    async rechercherProjetsSimilaires(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: "Données invalides",
                    errors: errors.array(),
                });
            }

            const { videoId } = req.params;
            const {
                limit = 5,
                thematique = null,
                score_minimum = 0.5,
                inclure_utilisateur = false
            } = req.query;

            const options = {
                limit: parseInt(limit),
                thematique,
                scoreMinimum: parseFloat(score_minimum),
                inclureUtilisateur: inclure_utilisateur === "true"
            };

            const resultats = await this.correspondanceService.trouverProjetsSimilaires(videoId, options);
            res.json({
                success: true,
                data: resultats
            });
        } catch (error) {
            console.error("Erreur lors de la recherche de projets similaires:", error);
            if (error.message.includes("non trouvée") || error.message.includes("non terminée")) {
                return res.status(404).json({
                    success: false,
                    message: error.message,
                });
            }
            res.status(500).json({
                success: false,
                message: "Erreur interne du serveur lors de la recherche de projets similaires.",
                error: error.message,
            });
        }
    }

    /**
     * Récupère les recommandations de projets pour un utilisateur.
     */
    async getRecommandations(req, res) {
        try {
            const userId = req.user.id;
            const resultats = await this.correspondanceService.getRecommandationsForUser(userId);
            res.json({
                success: true,
                data: resultats
            });
        } catch (error) {
            console.error("Erreur lors de la récupération des recommandations:", error);
            res.status(500).json({
                success: false,
                message: "Erreur interne du serveur lors de la récupération des recommandations.",
                error: error.message,
            });
        }
    }

    /**
     * Recherche des collaborateurs potentiels pour une vidéo donnée.
     */
    async rechercherCollaborateurs(req, res) {
        try {
            const { videoId } = req.params;
            const { limit = 5 } = req.query;

            const resultats = await this.correspondanceService.trouverCollaborateursPotentiels(videoId, { limit: parseInt(limit) });
            res.json({
                success: true,
                data: resultats
            });
        } catch (error) {
            console.error("Erreur lors de la recherche de collaborateurs:", error);
            if (error.message.includes("non trouvée") || error.message.includes("non analysée")) {
                return res.status(404).json({
                    success: false,
                    message: error.message,
                });
            }
            res.status(500).json({
                success: false,
                message: "Erreur interne du serveur lors de la recherche de collaborateurs.",
                error: error.message,
            });
        }
    }

    /**
     * Calcule la compatibilité entre deux projets (vidéos).
     */
    async calculerCompatibilite(req, res) {
        try {
            const { videoId1, videoId2 } = req.params;
            const compatibilite = await this.correspondanceService.calculerCompatibiliteProjets(videoId1, videoId2);
            res.json({
                success: true,
                data: { compatibilite }
            });
        } catch (error) {
            console.error("Erreur lors du calcul de compatibilité:", error);
            if (error.message.includes("non trouvée") || error.message.includes("non analysée")) {
                return res.status(404).json({
                    success: false,
                    message: error.message,
                });
            }
            res.status(500).json({
                success: false,
                message: "Erreur interne du serveur lors du calcul de compatibilité.",
                error: error.message,
            });
        }
    }
}

module.exports = MiseEnCorrespondanceController;


