const Video = require('../models/Video');
const AnalyseIAService = require('../services/analyseIAService');
const { validationResult } = require('express-validator');

class AnalyseIAController {
  constructor() {
    this.analyseService = new AnalyseIAService();
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
          message: 'Données invalides',
          errors: errors.array()
        });
      }

      const { videoId } = req.params;
      const userId = req.user.id;

      // Vérifier que la vidéo existe et appartient à l'utilisateur
      const video = await Video.findOne({
        where: {
          id: videoId,
          user_id: userId
        }
      });

      if (!video) {
        return res.status(404).json({
          success: false,
          message: 'Vidéo non trouvée'
        });
      }

      // Vérifier que l'analyse n'est pas déjà en cours
      if (video.analyse_ia_status === 'en_cours') {
        return res.status(409).json({
          success: false,
          message: 'Analyse déjà en cours pour cette vidéo'
        });
      }

      // Marquer l'analyse comme en cours
      await video.update({
        analyse_ia_status: 'en_cours'
      });

      // Lancer l'analyse en arrière-plan
      this.analyserVideoAsync(video);

      res.json({
        success: true,
        message: 'Analyse IA lancée',
        data: {
          videoId: video.id,
          statut: 'en_cours'
        }
      });

    } catch (error) {
      console.error('Erreur lors du lancement de l\'analyse IA:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }

  /**
   * Récupère le statut et les résultats de l'analyse IA
   */
  async obtenirResultatsAnalyse(req, res) {
    try {
      const { videoId } = req.params;
      const userId = req.user.id;

      const video = await Video.findOne({
        where: {
          id: videoId,
          user_id: userId
        },
        attributes: [
          'id', 'titre', 'analyse_ia_status', 'transcription',
          'mots_cles_ia', 'resume_ia', 'entites_nommees',
          'score_qualite_pitch', 'date_analyse_ia'
        ]
      });

      if (!video) {
        return res.status(404).json({
          success: false,
          message: 'Vidéo non trouvée'
        });
      }

      res.json({
        success: true,
        data: {
          video: {
            id: video.id,
            titre: video.titre,
            statut_analyse: video.analyse_ia_status,
            transcription: video.transcription,
            mots_cles: video.mots_cles_ia,
            resume: video.resume_ia,
            entites_nommees: video.entites_nommees,
            score_qualite: video.score_qualite_pitch,
            date_analyse: video.date_analyse_ia
          }
        }
      });

    } catch (error) {
      console.error('Erreur lors de la récupération des résultats:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }

  /**
   * Recherche de vidéos similaires basée sur l'IA
   */
  async rechercherVideosSimilaires(req, res) {
    try {
      const { videoId } = req.params;
      const { limit = 5 } = req.query;

      // Récupérer la vidéo de référence
      const videoRef = await Video.findByPk(videoId, {
        attributes: ['id', 'titre', 'embedding_vector', 'analyse_ia_status']
      });

      if (!videoRef) {
        return res.status(404).json({
          success: false,
          message: 'Vidéo non trouvée'
        });
      }

      if (videoRef.analyse_ia_status !== 'complete' || !videoRef.embedding_vector) {
        return res.status(400).json({
          success: false,
          message: 'L\'analyse IA de cette vidéo n\'est pas terminée'
        });
      }

      // Récupérer toutes les vidéos avec embeddings
      const videosAvecEmbeddings = await Video.findAll({
        where: {
          analyse_ia_status: 'complete',
          embedding_vector: { [require('sequelize').Op.ne]: null }
        },
        attributes: [
          'id', 'titre', 'description', 'thematique', 'embedding_vector',
          'mots_cles_ia', 'score_qualite_pitch', 'vues', 'likes'
        ]
      });

      // Calculer la similarité
      const videoRefEmbedding = JSON.parse(videoRef.embedding_vector);
      const videosSimilaires = [];

      for (const video of videosAvecEmbeddings) {
        if (video.id === videoId) continue; // Exclure la vidéo de référence

        const embedding = JSON.parse(video.embedding_vector);
        const similarite = this.calculerSimilariteCosinus(videoRefEmbedding, embedding);

        videosSimilaires.push({
          id: video.id,
          titre: video.titre,
          description: video.description,
          thematique: video.thematique,
          mots_cles: video.mots_cles_ia,
          score_qualite: video.score_qualite_pitch,
          vues: video.vues,
          likes: video.likes,
          score_similarite: similarite
        });
      }

      // Trier par similarité décroissante et limiter les résultats
      videosSimilaires.sort((a, b) => b.score_similarite - a.score_similarite);
      const resultats = videosSimilaires.slice(0, parseInt(limit));

      res.json({
        success: true,
        data: {
          video_reference: {
            id: videoRef.id,
            titre: videoRef.titre
          },
          videos_similaires: resultats,
          total: resultats.length
        }
      });

    } catch (error) {
      console.error('Erreur lors de la recherche de similarité:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }

  /**
   * Obtient des statistiques sur l'analyse IA
   */
  async obtenirStatistiquesIA(req, res) {
    try {
      const userId = req.user.id;

      const stats = await Video.findAll({
        where: { user_id: userId },
        attributes: [
          'analyse_ia_status',
          [require('sequelize').fn('COUNT', '*'), 'count']
        ],
        group: ['analyse_ia_status'],
        raw: true
      });

      const statistiques = {
        total: 0,
        en_attente: 0,
        en_cours: 0,
        complete: 0,
        echec: 0
      };

      stats.forEach(stat => {
        statistiques[stat.analyse_ia_status] = parseInt(stat.count);
        statistiques.total += parseInt(stat.count);
      });

      res.json({
        success: true,
        data: { statistiques }
      });

    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }

  /**
   * Analyse une vidéo de manière asynchrone
   */
  async analyserVideoAsync(video) {
    try {
      console.log(`Début de l'analyse IA pour la vidéo ${video.id}`);

      // Simuler le chemin du fichier vidéo (à adapter selon votre stockage)
      const videoPath = video.url_video; // Ou le chemin local si stocké localement

      // Lancer l'analyse
      const resultats = await this.analyseService.analyserVideo(videoPath);

      // Mettre à jour la vidéo avec les résultats
      await video.update({
        transcription: resultats.transcription,
        mots_cles_ia: resultats.mots_cles,
        resume_ia: resultats.resume,
        embedding_vector: JSON.stringify(resultats.embedding),
        entites_nommees: resultats.entites_nommees,
        score_qualite_pitch: resultats.score_qualite,
        analyse_ia_status: resultats.statut,
        date_analyse_ia: new Date()
      });

      console.log(`Analyse IA terminée pour la vidéo ${video.id} avec le statut: ${resultats.statut}`);

    } catch (error) {
      console.error(`Erreur lors de l'analyse IA de la vidéo ${video.id}:`, error);

      // Marquer l'analyse comme échouée
      await video.update({
        analyse_ia_status: 'echec',
        date_analyse_ia: new Date()
      });
    }
  }

  /**
   * Calcule la similarité cosinus entre deux vecteurs
   */
  calculerSimilariteCosinus(vecA, vecB) {
    if (vecA.length !== vecB.length) {
      throw new Error('Les vecteurs doivent avoir la même dimension');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (normA * normB);
  }
}

module.exports = new AnalyseIAController();

