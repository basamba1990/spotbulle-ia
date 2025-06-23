const MiseEnCorrespondanceService = require('../services/miseEnCorrespondanceService');
const { validationResult } = require('express-validator');

class MiseEnCorrespondanceController {
  constructor() {
    this.correspondanceService = new MiseEnCorrespondanceService();
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
          message: 'Données invalides',
          errors: errors.array()
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
        inclureUtilisateur: inclure_utilisateur === 'true'
      };

      const resultats = await this.correspondanceService.trouverProjetsSimilaires(videoId, options);

      res.json({
        success: true,
        data: resultats
      });

    } catch (error) {
      console.error('Erreur lors de la recherche de projets similaires:', error);
      
      if (error.message.includes('non trouvée') || error.message.includes('non terminée')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }

  /**
   * Génère des recommandations de projets pour un utilisateur
   */
  async recommanderProjets(req, res) {
    try {
      const userId = req.user.id;
      const {
        limit = 10,
        thematiques = null,
        score_minimum = 0.6
      } = req.query;

      const options = {
        limit: parseInt(limit),
        thematiques: thematiques ? thematiques.split(',') : null,
        scoreMinimum: parseFloat(score_minimum)
      };

      const resultats = await this.correspondanceService.recommanderProjets(userId, options);

      res.json({
        success: true,
        data: resultats
      });

    } catch (error) {
      console.error('Erreur lors de la génération de recommandations:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }

  /**
   * Trouve des collaborateurs potentiels pour un projet
   */
  async trouverCollaborateurs(req, res) {
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
      const {
        limit = 5,
        score_minimum = 0.6
      } = req.query;

      const options = {
        limit: parseInt(limit),
        scoreMinimum: parseFloat(score_minimum)
      };

      const resultats = await this.correspondanceService.trouverCollaborateursPotentiels(videoId, options);

      res.json({
        success: true,
        data: resultats
      });

    } catch (error) {
      console.error('Erreur lors de la recherche de collaborateurs:', error);
      
      if (error.message.includes('non trouvé') || error.message.includes('incomplète')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }

  /**
   * Recherche avancée de projets avec filtres multiples
   */
  async rechercheAvancee(req, res) {
    try {
      const {
        mots_cles = '',
        thematiques = '',
        score_qualite_min = 0,
        date_debut = null,
        date_fin = null,
        limit = 20,
        page = 1
      } = req.query;

      // Cette méthode pourrait être étendue pour inclure une recherche textuelle
      // combinée avec la similarité sémantique
      
      res.json({
        success: true,
        message: 'Fonctionnalité de recherche avancée en développement',
        data: {
          criteres_recus: {
            mots_cles,
            thematiques: thematiques.split(',').filter(t => t),
            score_qualite_min: parseFloat(score_qualite_min),
            date_debut,
            date_fin,
            limit: parseInt(limit),
            page: parseInt(page)
          }
        }
      });

    } catch (error) {
      console.error('Erreur lors de la recherche avancée:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }

  /**
   * Obtient des statistiques sur les correspondances et recommandations
   */
  async obtenirStatistiquesCorrespondance(req, res) {
    try {
      const userId = req.user.id;

      // Récupérer des statistiques basiques
      // Cette méthode pourrait être étendue pour fournir des insights plus détaillés
      
      res.json({
        success: true,
        data: {
          statistiques: {
            message: 'Statistiques de correspondance en développement',
            utilisateur_id: userId
          }
        }
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
   * Évalue la compatibilité entre deux projets
   */
  async evaluerCompatibilite(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Données invalides',
          errors: errors.array()
        });
      }

      const { videoId1, videoId2 } = req.params;

      // Utiliser le service pour calculer la similarité entre deux projets spécifiques
      const resultats1 = await this.correspondanceService.trouverProjetsSimilaires(videoId1, {
        limit: 100,
        scoreMinimum: 0,
        inclureUtilisateur: true
      });

      // Chercher videoId2 dans les résultats
      const projetCompatible = resultats1.projets_similaires.find(p => p.id === videoId2);

      if (!projetCompatible) {
        return res.status(404).json({
          success: false,
          message: 'Impossible d\'évaluer la compatibilité entre ces projets'
        });
      }

      res.json({
        success: true,
        data: {
          projet1: resultats1.video_reference,
          projet2: {
            id: projetCompatible.id,
            titre: projetCompatible.titre,
            thematique: projetCompatible.thematique
          },
          score_compatibilite: projetCompatible.score_similarite,
          niveau_compatibilite: this.determinerNiveauCompatibilite(projetCompatible.score_similarite),
          recommandation: this.genererRecommandationCompatibilite(projetCompatible.score_similarite),
          domaines_communs: this.extraireDomainesCommuns(
            resultats1.video_reference,
            projetCompatible
          )
        }
      });

    } catch (error) {
      console.error('Erreur lors de l\'évaluation de compatibilité:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }

  // Méthodes utilitaires

  determinerNiveauCompatibilite(score) {
    if (score >= 0.8) return 'Très élevée';
    if (score >= 0.7) return 'Élevée';
    if (score >= 0.6) return 'Modérée';
    if (score >= 0.4) return 'Faible';
    return 'Très faible';
  }

  genererRecommandationCompatibilite(score) {
    if (score >= 0.8) {
      return 'Ces projets sont très similaires et pourraient bénéficier d\'une collaboration étroite.';
    }
    if (score >= 0.7) {
      return 'Ces projets partagent des concepts importants et une collaboration serait bénéfique.';
    }
    if (score >= 0.6) {
      return 'Ces projets ont des points communs intéressants pour une éventuelle collaboration.';
    }
    if (score >= 0.4) {
      return 'Ces projets ont quelques similitudes mais la collaboration nécessiterait plus d\'analyse.';
    }
    return 'Ces projets sont très différents, une collaboration semble peu probable.';
  }

  extraireDomainesCommuns(projet1, projet2) {
    const domaines = [];
    
    if (projet1.thematique === projet2.thematique) {
      domaines.push(`Même thématique: ${projet1.thematique}`);
    }

    // Ajouter d'autres analyses de domaines communs basées sur les mots-clés
    // Cette logique pourrait être étendue

    return domaines;
  }
}

module.exports = new MiseEnCorrespondanceController();

