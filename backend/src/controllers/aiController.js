const Video = require('../models/Video');
const aiAnalysisService = require('../services/aiAnalysisService');

const aiController = {
  /**
   * Déclencher l'analyse IA d'une vidéo
   */
  analyzeVideo: async (req, res) => {
    try {
      const { id } = req.params;
      
      const video = await Video.findByPk(id);
      
      if (!video) {
        return res.status(404).json({
          success: false,
          message: 'Vidéo introuvable'
        });
      }

      // Vérifier que l'utilisateur est le propriétaire ou admin
      if (video.user_id !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Accès refusé'
        });
      }

      // Vérifier que la vidéo est active
      if (video.statut !== 'actif') {
        return res.status(400).json({
          success: false,
          message: 'La vidéo doit être active pour être analysée'
        });
      }

      // Vérifier si une analyse est déjà en cours
      if (video.statut_analyse_ia === 'en_cours') {
        return res.status(400).json({
          success: false,
          message: 'Une analyse est déjà en cours pour cette vidéo'
        });
      }

      // Marquer l'analyse comme en cours
      await video.update({
        statut_analyse_ia: 'en_cours'
      });

      // Lancer l'analyse en arrière-plan
      setImmediate(async () => {
        try {
          const analysisResults = await aiAnalysisService.analyzeVideo(video);
          await video.update(analysisResults);
        } catch (error) {
          console.error('Erreur lors de l\'analyse IA:', error);
          await video.update({
            statut_analyse_ia: 'erreur',
            date_analyse_ia: new Date()
          });
        }
      });

      res.json({
        success: true,
        message: 'Analyse IA démarrée',
        data: {
          video_id: video.id,
          statut: 'en_cours'
        }
      });

    } catch (error) {
      console.error('Erreur lors du démarrage de l\'analyse IA:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur lors du démarrage de l\'analyse'
      });
    }
  },

  /**
   * Obtenir le statut de l'analyse IA d'une vidéo
   */
  getAnalysisStatus: async (req, res) => {
    try {
      const { id } = req.params;
      
      const video = await Video.findByPk(id, {
        attributes: [
          'id', 'statut_analyse_ia', 'date_analyse_ia',
          'transcription_ia', 'mots_cles_ia', 'score_pitch',
          'analyse_sentiment', 'projets_correspondants'
        ]
      });
      
      if (!video) {
        return res.status(404).json({
          success: false,
          message: 'Vidéo introuvable'
        });
      }

      res.json({
        success: true,
        data: {
          video_id: video.id,
          statut_analyse_ia: video.statut_analyse_ia,
          date_analyse_ia: video.date_analyse_ia,
          resultats: video.statut_analyse_ia === 'termine' ? {
            transcription: video.transcription_ia,
            mots_cles: video.mots_cles_ia,
            score_pitch: video.score_pitch,
            sentiment: video.analyse_sentiment,
            projets_similaires: video.projets_correspondants
          } : null
        }
      });

    } catch (error) {
      console.error('Erreur lors de la récupération du statut:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur lors de la récupération du statut'
      });
    }
  },

  /**
   * Obtenir les projets similaires à une vidéo
   */
  getSimilarProjects: async (req, res) => {
    try {
      const { id } = req.params;
      
      const video = await Video.findByPk(id);
      
      if (!video) {
        return res.status(404).json({
          success: false,
          message: 'Vidéo introuvable'
        });
      }

      if (!video.projets_correspondants || video.projets_correspondants.length === 0) {
        return res.json({
          success: true,
          data: {
            projets_similaires: []
          }
        });
      }

      // Récupérer les détails des projets similaires
      const similarVideos = await Video.findAll({
        where: {
          id: video.projets_correspondants
        },
        attributes: [
          'id', 'titre', 'description', 'thematique', 'url_thumbnail',
          'mots_cles_ia', 'score_pitch', 'vues', 'likes'
        ],
        include: [
          {
            model: require('../models/User'),
            as: 'user',
            attributes: ['id', 'nom', 'prenom']
          }
        ]
      });

      res.json({
        success: true,
        data: {
          projets_similaires: similarVideos
        }
      });

    } catch (error) {
      console.error('Erreur lors de la récupération des projets similaires:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur lors de la récupération des projets similaires'
      });
    }
  },

  /**
   * Rechercher des vidéos par mots-clés IA
   */
  searchByKeywords: async (req, res) => {
    try {
      const { keywords, page = 1, limit = 10 } = req.query;
      
      if (!keywords) {
        return res.status(400).json({
          success: false,
          message: 'Mots-clés requis'
        });
      }

      const keywordArray = keywords.split(',').map(k => k.trim().toLowerCase());
      const offset = (page - 1) * limit;

      const { Op } = require('sequelize');

      const { count, rows: videos } = await Video.findAndCountAll({
        where: {
          statut: 'actif',
          statut_analyse_ia: 'termine',
          mots_cles_ia: {
            [Op.overlap]: keywordArray
          }
        },
        attributes: [
          'id', 'titre', 'description', 'thematique', 'url_thumbnail',
          'mots_cles_ia', 'score_pitch', 'vues', 'likes', 'date_upload'
        ],
        include: [
          {
            model: require('../models/User'),
            as: 'user',
            attributes: ['id', 'nom', 'prenom']
          }
        ],
        order: [['score_pitch', 'DESC'], ['date_upload', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      res.json({
        success: true,
        data: {
          videos,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: count,
            pages: Math.ceil(count / limit)
          }
        }
      });

    } catch (error) {
      console.error('Erreur lors de la recherche par mots-clés:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur lors de la recherche'
      });
    }
  },

  /**
   * Obtenir les statistiques d'analyse IA
   */
  getAnalyticsStats: async (req, res) => {
    try {
      const { Op } = require('sequelize');
      const { sequelize } = require('../config/db');

      // Statistiques générales
      const totalVideos = await Video.count({
        where: { statut: 'actif' }
      });

      const analyzedVideos = await Video.count({
        where: { 
          statut: 'actif',
          statut_analyse_ia: 'termine'
        }
      });

      const pendingAnalysis = await Video.count({
        where: { 
          statut: 'actif',
          statut_analyse_ia: ['en_attente', 'en_cours']
        }
      });

      // Score moyen des pitchs
      const avgScore = await Video.findOne({
        where: {
          statut: 'actif',
          statut_analyse_ia: 'termine',
          score_pitch: { [Op.not]: null }
        },
        attributes: [
          [sequelize.fn('AVG', sequelize.col('score_pitch')), 'moyenne']
        ]
      });

      // Top mots-clés
      const topKeywords = await sequelize.query(`
        SELECT unnest(mots_cles_ia) as mot_cle, COUNT(*) as frequence
        FROM videos 
        WHERE statut = 'actif' AND statut_analyse_ia = 'termine'
        GROUP BY mot_cle 
        ORDER BY frequence DESC 
        LIMIT 10
      `, {
        type: sequelize.QueryTypes.SELECT
      });

      res.json({
        success: true,
        data: {
          statistiques: {
            total_videos: totalVideos,
            videos_analysees: analyzedVideos,
            analyses_en_attente: pendingAnalysis,
            score_moyen_pitch: avgScore?.dataValues?.moyenne ? 
              Math.round(avgScore.dataValues.moyenne * 100) / 100 : 0
          },
          top_mots_cles: topKeywords
        }
      });

    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur lors de la récupération des statistiques'
      });
    }
  }
};

module.exports = aiController;

