const Video = require("../models/Video");
const AnalyseIAService = require("../services/analyseIAService");
const { validationResult } = require("express-validator");

class AnalyseIAController {
    constructor(analyseService) {
        this.analyseService = analyseService;
        // Lier la méthode analyserVideoAsync à l'instance pour conserver le contexte 'this'
        this.analyserVideoAsync = this.analyserVideoAsync.bind(this);
    }

    /**
     * Lance l'analyse IA d'une vidéo
     */
    async lancerAnalyse(req, res) {
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
            const userId = req.user.id;

            // Vérifier que la vidéo existe et appartient à l'utilisateur
            const video = await Video.findOne({
                where: {
                    id: videoId,
                    user_id: userId,
                },
            });

            if (!video) {
                return res.status(404).json({
                    success: false,
                    message: "Vidéo non trouvée",
                });
            }

            // Vérifier que l'analyse n'est pas déjà en cours
            if (video.analyse_ia_status === "en_cours") {
                return res.status(409).json({
                    success: false,
                    message: "Analyse déjà en cours pour cette vidéo",
                });
            }

            // Mettre à jour le statut de la vidéo à 'en_cours'
            await video.update({ analyse_ia_status: "en_cours" });

            res.status(202).json({
                success: true,
                message: "Analyse IA lancée avec succès. Les résultats seront disponibles bientôt.",
            });

            // Lancer l'analyse en arrière-plan
            this.analyserVideoAsync(videoId, userId);

        } catch (error) {
            console.error("Erreur lors du lancement de l'analyse IA:", error);
            res.status(500).json({
                success: false,
                message: "Erreur interne du serveur lors du lancement de l'analyse IA.",
                error: error.message,
            });
        }
    }

    /**
     * Récupère les résultats de l'analyse IA pour une vidéo.
     */
    async getResultatsAnalyse(req, res) {
        try {
            const { videoId } = req.params;
            const userId = req.user.id;

            const video = await Video.findOne({
                where: {
                    id: videoId,
                    user_id: userId,
                },
                attributes: ["id", "titre", "transcription", "mots_cles", "resume", "analyse_ia_status", "embedding_vector"],
            });

            if (!video) {
                return res.status(404).json({
                    success: false,
                    message: "Vidéo non trouvée ou non autorisée",
                });
            }

            if (video.analyse_ia_status !== "complete") {
                return res.status(200).json({
                    success: true,
                    message: "Analyse en cours ou non démarrée.",
                    status: video.analyse_ia_status,
                });
            }

            res.status(200).json({
                success: true,
                data: {
                    id: video.id,
                    titre: video.titre,
                    transcription: video.transcription,
                    mots_cles: video.mots_cles ? JSON.parse(video.mots_cles) : [],
                    resume: video.resume,
                    status: video.analyse_ia_status,
                },
            });

        } catch (error) {
            console.error("Erreur lors de la récupération des résultats d'analyse IA:", error);
            res.status(500).json({
                success: false,
                message: "Erreur interne du serveur lors de la récupération des résultats d'analyse IA.",
                error: error.message,
            });
        }
    }

    /**
     * Récupère les statistiques d'utilisation de l'IA.
     */
    async getStatistiquesIA(req, res) {
        try {
            const totalVideos = await Video.count();
            const videosAnalyzed = await Video.count({
                where: { analyse_ia_status: "complete" },
            });
            const videosInProgress = await Video.count({
                where: { analyse_ia_status: "en_cours" },
            });

            res.status(200).json({
                success: true,
                data: {
                    totalVideos,
                    videosAnalyzed,
                    videosInProgress,
                    percentageAnalyzed: totalVideos > 0 ? (videosAnalyzed / totalVideos) * 100 : 0,
                },
            });
        } catch (error) {
            console.error("Erreur lors de la récupération des statistiques IA:", error);
            res.status(500).json({
                success: false,
                message: "Erreur interne du serveur lors de la récupération des statistiques IA.",
                error: error.message,
            });
        }
    }

    /**
     * Méthode asynchrone pour analyser la vidéo.
     * Cette méthode est appelée en arrière-plan.
     */
    async analyserVideoAsync(videoId, userId) {
        let video;
        try {
            video = await Video.findOne({
                where: { id: videoId, user_id: userId },
            });

            if (!video) {
                console.error(`Vidéo ${videoId} non trouvée pour l'analyse asynchrone.`);
                return;
            }

            // 1. Transcription audio
            console.log(`Début de la transcription pour la vidéo ${videoId}...`);
            const transcription = await this.analyseService.transcribeVideo(video.url);
            console.log(`Transcription terminée pour la vidéo ${videoId}.`);

            // 2. Extraction de mots-clés
            console.log(`Début de l'extraction de mots-clés pour la vidéo ${videoId}...`);
            const motsCles = await this.analyseService.extractKeywords(transcription);
            console.log(`Extraction de mots-clés terminée pour la vidéo ${videoId}.`);

            // 3. Génération de résumé
            console.log(`Début de la génération de résumé pour la vidéo ${videoId}...`);
            const resume = await this.analyseService.generateSummary(transcription);
            console.log(`Génération de résumé terminée pour la vidéo ${videoId}.`);

            // 4. Génération d'embedding
            console.log(`Début de la génération d'embedding pour la vidéo ${videoId}...`);
            const embedding = await this.analyseService.generateEmbedding(transcription);
            console.log(`Génération d'embedding terminée pour la vidéo ${videoId}.`);

            // Mettre à jour la vidéo avec les résultats
            await video.update({
                transcription: transcription,
                mots_cles: JSON.stringify(motsCles),
                resume: resume,
                embedding_vector: embedding,
                analyse_ia_status: "complete",
            });
            console.log(`Analyse IA complète pour la vidéo ${videoId}.`);

        } catch (error) {
            console.error(`Erreur critique lors de l'analyse IA asynchrone pour la vidéo ${videoId}:`, error);
            if (video) {
                await video.update({ analyse_ia_status: "echec" });
            }
        }
    }
}

module.exports = AnalyseIAController;


