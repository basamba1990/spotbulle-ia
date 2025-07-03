const Video = require("../models/Video");
const User = require("../models/User");
const { Op } = require("sequelize");

class MiseEnCorrespondanceService {
    constructor() {
        this.seuilSimilarite = 0.7; // Seuil minimum de similarité pour considérer deux projets comme similaires
        this.nombreMaxRecommandations = 10;
    }

    /**
     * Trouve des projets similaires basés sur l'embedding d'une vidéo
     * @param {string} videoId - ID de la vidéo de référence
     * @param {Object} options - Options de recherche
     * @returns {Promise<Array>} - Liste des projets similaires
     */
    async trouverProjetsSimilaires(videoId, options = {}) {
        try {
            const {
                limit = 5,
                thematique = null,
                scoreMinimum = 0.5,
                inclureUtilisateur = false
            } = options;

            // Récupérer la vidéo de référence
            const videoRef = await Video.findByPk(videoId, {
                attributes: ["id", "titre", "embedding_vector", "analyse_ia_status", "user_id", "thematique"],
                include: [{
                    model: User,
                    as: "user",
                    attributes: ["id", "nom", "prenom", "email"]
                }]
            });

            if (!videoRef) {
                throw new Error("Vidéo de référence non trouvée");
            }

            if (videoRef.analyse_ia_status !== "complete" || !videoRef.embedding_vector) {
                throw new Error("L'analyse IA de cette vidéo n'est pas terminée ou l'embedding est manquant.");
            }

            // Construire les critères de recherche
            const whereClause = {
                analyse_ia_status: "complete",
                embedding_vector: { [Op.ne]: null },
                id: { [Op.ne]: videoId } // Exclure la vidéo de référence
            };

            if (thematique) {
                whereClause.thematique = thematique;
            }

            // Récupérer toutes les autres vidéos analysées
            const allVideos = await Video.findAll({
                where: whereClause,
                attributes: ["id", "titre", "embedding_vector", "analyse_ia_status", "user_id", "thematique"],
                include: [{
                    model: User,
                    as: "user",
                    attributes: ["id", "nom", "prenom", "email"]
                }]
            });

            // Calculer la similarité cosinus avec chaque vidéo
            const similarVideos = allVideos.map(video => {
                const similarity = this.cosineSimilarity(
                    videoRef.embedding_vector,
                    video.embedding_vector
                );
                return { video, similarity };
            }).filter(item => item.similarity >= scoreMinimum)
              .sort((a, b) => b.similarity - a.similarity)
              .slice(0, limit);

            return similarVideos.map(item => ({
                id: item.video.id,
                titre: item.video.titre,
                thematique: item.video.thematique,
                utilisateur: inclureUtilisateur ? item.video.user : undefined,
                similarite: item.similarity
            }));

        } catch (error) {
            console.error("Erreur lors de la recherche de projets similaires:", error);
            throw error;
        }
    }

    /**
     * Recommande des projets à un utilisateur basé sur ses vidéos.
     * @param {string} userId - ID de l'utilisateur.
     * @param {Object} options - Options de recherche.
     * @returns {Promise<Array>} - Liste de projets recommandés.
     */
    async getRecommandationsForUser(userId, options = {}) {
        try {
            const userVideos = await Video.findAll({
                where: { user_id: userId, analyse_ia_status: "complete", embedding_vector: { [Op.ne]: null } },
                attributes: ["id", "titre", "embedding_vector", "thematique"]
            });

            if (userVideos.length === 0) {
                return [];
            }

            // Créer un embedding moyen pour l'utilisateur
            const userAvgEmbedding = this.calculateAverageEmbedding(userVideos.map(v => v.embedding_vector));

            // Trouver toutes les autres vidéos analysées (excluant celles de l'utilisateur)
            const allOtherVideos = await Video.findAll({
                where: {
                    user_id: { [Op.ne]: userId },
                    analyse_ia_status: "complete",
                    embedding_vector: { [Op.ne]: null }
                },
                attributes: ["id", "titre", "embedding_vector", "thematique"],
                include: [{
                    model: User,
                    as: "user",
                    attributes: ["id", "nom", "prenom", "email"]
                }]
            });

            const recommendations = allOtherVideos.map(video => {
                const similarity = this.cosineSimilarity(userAvgEmbedding, video.embedding_vector);
                return { video, similarity };
            }).filter(item => item.similarity >= this.seuilSimilarite)
              .sort((a, b) => b.similarity - a.similarity)
              .slice(0, this.nombreMaxRecommandations);

            return recommendations.map(item => ({
                id: item.video.id,
                titre: item.video.titre,
                thematique: item.video.thematique,
                utilisateur: item.video.user,
                similarite: item.similarity
            }));

        } catch (error) {
            console.error("Erreur lors de la récupération des recommandations pour l'utilisateur:", error);
            throw error;
        }
    }

    /**
     * Trouve des collaborateurs potentiels basés sur la similarité des projets.
     * @param {string} videoId - ID de la vidéo de référence.
     * @param {Object} options - Options de recherche.
     * @returns {Promise<Array>} - Liste de collaborateurs potentiels.
     */
    async trouverCollaborateursPotentiels(videoId, options = {}) {
        try {
            const { limit = 5 } = options;

            const videoRef = await Video.findByPk(videoId, {
                attributes: ["id", "user_id", "embedding_vector", "analyse_ia_status"]
            });

            if (!videoRef || videoRef.analyse_ia_status !== "complete" || !videoRef.embedding_vector) {
                throw new Error("Vidéo de référence non trouvée ou non analysée.");
            }

            // Trouver des vidéos similaires d'autres utilisateurs
            const similarVideos = await this.trouverProjetsSimilaires(videoId, { limit: 100, inclureUtilisateur: true });

            const potentialCollaborators = {};

            for (const item of similarVideos) {
                if (item.utilisateur && item.utilisateur.id !== videoRef.user_id) {
                    if (!potentialCollaborators[item.utilisateur.id]) {
                        potentialCollaborators[item.utilisateur.id] = {
                            id: item.utilisateur.id,
                            nom: item.utilisateur.nom,
                            prenom: item.utilisateur.prenom,
                            email: item.utilisateur.email,
                            scoreMoyenSimilarite: 0,
                            projetsSimilaires: []
                        };
                    }
                    potentialCollaborators[item.utilisateur.id].projetsSimilaires.push({
                        id: item.id,
                        titre: item.titre,
                        similarite: item.similarite
                    });
                    // Mettre à jour le score moyen (simple moyenne pour l'instant)
                    const currentCollaborator = potentialCollaborators[item.utilisateur.id];
                    const totalSimilarity = currentCollaborator.projetsSimilaires.reduce((sum, p) => sum + p.similarite, 0);
                    currentCollaborator.scoreMoyenSimilarite = totalSimilarity / currentCollaborator.projetsSimilaires.length;
                }
            }

            return Object.values(potentialCollaborators)
                .sort((a, b) => b.scoreMoyenSimilarite - a.scoreMoyenSimilarite)
                .slice(0, limit);

        } catch (error) {
            console.error("Erreur lors de la recherche de collaborateurs potentiels:", error);
            throw error;
        }
    }

    /**
     * Calcule la compatibilité entre deux projets (vidéos).
     * @param {string} videoId1 - ID de la première vidéo.
     * @param {string} videoId2 - ID de la deuxième vidéo.
     * @returns {Promise<number>} - Score de compatibilité (similarité cosinus).
     */
    async calculerCompatibiliteProjets(videoId1, videoId2) {
        try {
            const video1 = await Video.findByPk(videoId1, {
                attributes: ["embedding_vector", "analyse_ia_status"]
            });
            const video2 = await Video.findByPk(videoId2, {
                attributes: ["embedding_vector", "analyse_ia_status"]
            });

            if (!video1 || video1.analyse_ia_status !== "complete" || !video1.embedding_vector) {
                throw new Error("Première vidéo non trouvée ou non analysée.");
            }
            if (!video2 || video2.analyse_ia_status !== "complete" || !video2.embedding_vector) {
                throw new Error("Deuxième vidéo non trouvée ou non analysée.");
            }

            return this.cosineSimilarity(video1.embedding_vector, video2.embedding_vector);

        } catch (error) {
            console.error("Erreur lors du calcul de compatibilité des projets:", error);
            throw error;
        }
    }

    /**
     * Calcule la similarité cosinus entre deux vecteurs.
     * @param {number[]} vec1 - Premier vecteur.
     * @param {number[]} vec2 - Deuxième vecteur.
     * @returns {number} - Score de similarité cosinus (entre -1 et 1).
     */
    cosineSimilarity(vec1, vec2) {
        if (vec1.length !== vec2.length) {
            throw new Error("Les vecteurs doivent avoir la même taille.");
        }

        let dotProduct = 0;
        let magnitude1 = 0;
        let magnitude2 = 0;

        for (let i = 0; i < vec1.length; i++) {
            dotProduct += vec1[i] * vec2[i];
            magnitude1 += vec1[i] * vec1[i];
            magnitude2 += vec2[i] * vec2[i];
        }

        magnitude1 = Math.sqrt(magnitude1);
        magnitude2 = Math.sqrt(magnitude2);

        if (magnitude1 === 0 || magnitude2 === 0) {
            return 0; // Évite la division par zéro
        }

        return dotProduct / (magnitude1 * magnitude2);
    }

    /**
     * Calcule l'embedding moyen d'un ensemble de vecteurs.
     * @param {Array<number[]>} embeddings - Tableau de vecteurs d'embedding.
     * @returns {number[]} - Vecteur d'embedding moyen.
     */
    calculateAverageEmbedding(embeddings) {
        if (embeddings.length === 0) {
            return [];
        }

        const dimension = embeddings[0].length;
        const avgEmbedding = Array(dimension).fill(0);

        for (const embedding of embeddings) {
            for (let i = 0; i < dimension; i++) {
                avgEmbedding[i] += embedding[i];
            }
        }

        for (let i = 0; i < dimension; i++) {
            avgEmbedding[i] /= embeddings.length;
        }

        return avgEmbedding;
    }
}

module.exports = MiseEnCorrespondanceService;


