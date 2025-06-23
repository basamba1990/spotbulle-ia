const Video = require('../models/Video');
const User = require('../models/User');
const { Op } = require('sequelize');

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
        attributes: ['id', 'titre', 'embedding_vector', 'analyse_ia_status', 'user_id', 'thematique'],
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'nom', 'prenom', 'email']
        }]
      });

      if (!videoRef) {
        throw new Error('Vidéo de référence non trouvée');
      }

      if (videoRef.analyse_ia_status !== 'complete' || !videoRef.embedding_vector) {
        throw new Error('L\'analyse IA de cette vidéo n\'est pas terminée');
      }

      // Construire les critères de recherche
      const whereClause = {
        analyse_ia_status: 'complete',
        embedding_vector: { [Op.ne]: null },
        id: { [Op.ne]: videoId } // Exclure la vidéo de référence
      };

      // Filtrer par thématique si spécifié
      if (thematique) {
        whereClause.thematique = thematique;
      }

      // Exclure les vidéos du même utilisateur si demandé
      if (!inclureUtilisateur) {
        whereClause.user_id = { [Op.ne]: videoRef.user_id };
      }

      // Récupérer toutes les vidéos candidates
      const videosCandidates = await Video.findAll({
        where: whereClause,
        attributes: [
          'id', 'titre', 'description', 'thematique', 'embedding_vector',
          'mots_cles_ia', 'score_qualite_pitch', 'vues', 'likes', 'user_id',
          'date_upload', 'resume_ia'
        ],
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'nom', 'prenom']
        }],
        limit: 100 // Limiter pour éviter de traiter trop de données
      });

      // Calculer la similarité pour chaque vidéo candidate
      const videoRefEmbedding = JSON.parse(videoRef.embedding_vector);
      const videosSimilaires = [];

      for (const video of videosCandidates) {
        try {
          const embedding = JSON.parse(video.embedding_vector);
          const similarite = this.calculerSimilariteCosinus(videoRefEmbedding, embedding);

          if (similarite >= scoreMinimum) {
            videosSimilaires.push({
              id: video.id,
              titre: video.titre,
              description: video.description,
              thematique: video.thematique,
              mots_cles: video.mots_cles_ia,
              score_qualite: video.score_qualite_pitch,
              vues: video.vues,
              likes: video.likes,
              date_upload: video.date_upload,
              resume: video.resume_ia,
              score_similarite: similarite,
              utilisateur: {
                id: video.user.id,
                nom: video.user.nom,
                prenom: video.user.prenom
              }
            });
          }
        } catch (error) {
          console.warn(`Erreur lors du calcul de similarité pour la vidéo ${video.id}:`, error.message);
        }
      }

      // Trier par similarité décroissante et limiter les résultats
      videosSimilaires.sort((a, b) => b.score_similarite - a.score_similarite);
      
      return {
        video_reference: {
          id: videoRef.id,
          titre: videoRef.titre,
          thematique: videoRef.thematique,
          utilisateur: {
            id: videoRef.user.id,
            nom: videoRef.user.nom,
            prenom: videoRef.user.prenom
          }
        },
        projets_similaires: videosSimilaires.slice(0, limit),
        total_trouve: videosSimilaires.length,
        criteres: {
          thematique,
          score_minimum: scoreMinimum,
          inclure_utilisateur: inclureUtilisateur
        }
      };

    } catch (error) {
      console.error('Erreur lors de la recherche de projets similaires:', error);
      throw error;
    }
  }

  /**
   * Recommande des projets pour un utilisateur basé sur ses vidéos existantes
   * @param {string} userId - ID de l'utilisateur
   * @param {Object} options - Options de recommandation
   * @returns {Promise<Array>} - Liste des projets recommandés
   */
  async recommanderProjets(userId, options = {}) {
    try {
      const {
        limit = 10,
        thematiques = null,
        scoreMinimum = 0.6
      } = options;

      // Récupérer les vidéos de l'utilisateur avec analyse IA complète
      const videosUtilisateur = await Video.findAll({
        where: {
          user_id: userId,
          analyse_ia_status: 'complete',
          embedding_vector: { [Op.ne]: null }
        },
        attributes: ['id', 'embedding_vector', 'mots_cles_ia', 'thematique'],
        order: [['date_upload', 'DESC']],
        limit: 5 // Utiliser les 5 vidéos les plus récentes pour le profil
      });

      if (videosUtilisateur.length === 0) {
        return {
          recommandations: [],
          message: 'Aucune vidéo analysée trouvée pour cet utilisateur'
        };
      }

      // Calculer un embedding moyen représentant les intérêts de l'utilisateur
      const embeddingMoyen = this.calculerEmbeddingMoyen(
        videosUtilisateur.map(v => JSON.parse(v.embedding_vector))
      );

      // Extraire les thématiques préférées de l'utilisateur
      const thematiquesPreferees = this.extraireThematiquesPreferees(videosUtilisateur);

      // Construire les critères de recherche
      const whereClause = {
        user_id: { [Op.ne]: userId }, // Exclure les vidéos de l'utilisateur
        analyse_ia_status: 'complete',
        embedding_vector: { [Op.ne]: null }
      };

      // Filtrer par thématiques si spécifié
      if (thematiques && thematiques.length > 0) {
        whereClause.thematique = { [Op.in]: thematiques };
      } else if (thematiquesPreferees.length > 0) {
        // Utiliser les thématiques préférées de l'utilisateur
        whereClause.thematique = { [Op.in]: thematiquesPreferees };
      }

      // Récupérer les vidéos candidates
      const videosCandidates = await Video.findAll({
        where: whereClause,
        attributes: [
          'id', 'titre', 'description', 'thematique', 'embedding_vector',
          'mots_cles_ia', 'score_qualite_pitch', 'vues', 'likes',
          'date_upload', 'resume_ia', 'user_id'
        ],
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'nom', 'prenom']
        }],
        limit: 50
      });

      // Calculer la similarité avec le profil de l'utilisateur
      const recommandations = [];

      for (const video of videosCandidates) {
        try {
          const embedding = JSON.parse(video.embedding_vector);
          const similarite = this.calculerSimilariteCosinus(embeddingMoyen, embedding);

          if (similarite >= scoreMinimum) {
            recommandations.push({
              id: video.id,
              titre: video.titre,
              description: video.description,
              thematique: video.thematique,
              mots_cles: video.mots_cles_ia,
              score_qualite: video.score_qualite_pitch,
              vues: video.vues,
              likes: video.likes,
              date_upload: video.date_upload,
              resume: video.resume_ia,
              score_pertinence: similarite,
              utilisateur: {
                id: video.user.id,
                nom: video.user.nom,
                prenom: video.user.prenom
              },
              raison_recommandation: this.genererRaisonRecommandation(
                videosUtilisateur, video, similarite
              )
            });
          }
        } catch (error) {
          console.warn(`Erreur lors du calcul de pertinence pour la vidéo ${video.id}:`, error.message);
        }
      }

      // Trier par pertinence et qualité
      recommandations.sort((a, b) => {
        // Pondérer la similarité et la qualité
        const scoreA = (a.score_pertinence * 0.7) + ((a.score_qualite || 0.5) * 0.3);
        const scoreB = (b.score_pertinence * 0.7) + ((b.score_qualite || 0.5) * 0.3);
        return scoreB - scoreA;
      });

      return {
        recommandations: recommandations.slice(0, limit),
        profil_utilisateur: {
          nombre_videos_analysees: videosUtilisateur.length,
          thematiques_preferees: thematiquesPreferees
        },
        total_trouve: recommandations.length
      };

    } catch (error) {
      console.error('Erreur lors de la génération de recommandations:', error);
      throw error;
    }
  }

  /**
   * Trouve des collaborateurs potentiels pour un projet
   * @param {string} videoId - ID de la vidéo du projet
   * @param {Object} options - Options de recherche
   * @returns {Promise<Array>} - Liste des collaborateurs potentiels
   */
  async trouverCollaborateursPotentiels(videoId, options = {}) {
    try {
      const { limit = 5, scoreMinimum = 0.6 } = options;

      // Récupérer le projet de référence
      const projetRef = await Video.findByPk(videoId, {
        attributes: ['id', 'titre', 'mots_cles_ia', 'thematique', 'embedding_vector'],
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'nom', 'prenom']
        }]
      });

      if (!projetRef || !projetRef.embedding_vector) {
        throw new Error('Projet non trouvé ou analyse IA incomplète');
      }

      // Rechercher des projets complémentaires (différente thématique mais mots-clés similaires)
      const projetsComplementaires = await this.trouverProjetsSimilaires(videoId, {
        limit: 20,
        scoreMinimum: scoreMinimum,
        inclureUtilisateur: false
      });

      // Analyser les compétences et domaines d'expertise
      const collaborateurs = [];

      for (const projet of projetsComplementaires.projets_similaires) {
        const competencesComplementaires = this.analyserComplementarite(
          projetRef.mots_cles_ia || [],
          projet.mots_cles || []
        );

        if (competencesComplementaires.score > 0.3) {
          collaborateurs.push({
            utilisateur: projet.utilisateur,
            projet: {
              id: projet.id,
              titre: projet.titre,
              thematique: projet.thematique
            },
            score_complementarite: competencesComplementaires.score,
            competences_apportees: competencesComplementaires.competences_apportees,
            domaines_communs: competencesComplementaires.domaines_communs,
            potentiel_collaboration: this.evaluerPotentielCollaboration(
              projetRef, projet
            )
          });
        }
      }

      // Trier par score de complémentarité
      collaborateurs.sort((a, b) => b.score_complementarite - a.score_complementarite);

      return {
        projet_reference: {
          id: projetRef.id,
          titre: projetRef.titre,
          thematique: projetRef.thematique
        },
        collaborateurs_potentiels: collaborateurs.slice(0, limit),
        total_trouve: collaborateurs.length
      };

    } catch (error) {
      console.error('Erreur lors de la recherche de collaborateurs:', error);
      throw error;
    }
  }

  // Méthodes utilitaires

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

  /**
   * Calcule l'embedding moyen d'une liste d'embeddings
   */
  calculerEmbeddingMoyen(embeddings) {
    if (embeddings.length === 0) return [];

    const dimension = embeddings[0].length;
    const embeddingMoyen = new Array(dimension).fill(0);

    for (const embedding of embeddings) {
      for (let i = 0; i < dimension; i++) {
        embeddingMoyen[i] += embedding[i];
      }
    }

    // Normaliser par le nombre d'embeddings
    for (let i = 0; i < dimension; i++) {
      embeddingMoyen[i] /= embeddings.length;
    }

    return embeddingMoyen;
  }

  /**
   * Extrait les thématiques préférées d'un utilisateur
   */
  extraireThematiquesPreferees(videos) {
    const compteurThematiques = {};
    
    videos.forEach(video => {
      compteurThematiques[video.thematique] = 
        (compteurThematiques[video.thematique] || 0) + 1;
    });

    return Object.entries(compteurThematiques)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3) // Top 3 thématiques
      .map(([thematique]) => thematique);
  }

  /**
   * Génère une raison pour la recommandation
   */
  genererRaisonRecommandation(videosUtilisateur, videoRecommandee, similarite) {
    const thematiquesUtilisateur = videosUtilisateur.map(v => v.thematique);
    const thematiquePrincipale = this.extraireThematiquesPreferees(videosUtilisateur)[0];

    if (videoRecommandee.thematique === thematiquePrincipale) {
      return `Projet similaire dans votre domaine de prédilection : ${thematiquePrincipale}`;
    }

    if (similarite > 0.8) {
      return 'Projet très similaire à vos intérêts';
    }

    if (similarite > 0.7) {
      return 'Projet avec des concepts proches de vos projets';
    }

    return 'Projet potentiellement intéressant pour vous';
  }

  /**
   * Analyse la complémentarité entre deux projets
   */
  analyserComplementarite(motsClesA, motsClesB) {
    const motsClesASet = new Set(motsClesA.map(mc => mc.keyword || mc));
    const motsClesBSet = new Set(motsClesB.map(mc => mc.keyword || mc));

    // Mots-clés communs
    const motsCommunsArray = [...motsClesASet].filter(mc => motsClesBSet.has(mc));
    const motsCommunsSet = new Set(motsCommunsArray);

    // Mots-clés uniques à B (compétences apportées)
    const competencesApportees = [...motsClesBSet].filter(mc => !motsClesASet.has(mc));

    // Score de complémentarité basé sur les mots communs et les compétences uniques
    const scoreCommun = motsCommunsArray.length / Math.max(motsClesASet.size, motsClesBSet.size);
    const scoreUnique = competencesApportees.length / motsClesBSet.size;

    return {
      score: (scoreCommun * 0.6) + (scoreUnique * 0.4),
      domaines_communs: motsCommunsArray,
      competences_apportees: competencesApportees.slice(0, 5) // Limiter à 5
    };
  }

  /**
   * Évalue le potentiel de collaboration entre deux projets
   */
  evaluerPotentielCollaboration(projetA, projetB) {
    let score = 0.5; // Score de base

    // Bonus si thématiques différentes mais complémentaires
    const thematiquesComplementaires = {
      'technologie': ['education', 'sante', 'professionnel'],
      'education': ['technologie', 'culture'],
      'sante': ['technologie', 'sport'],
      'professionnel': ['technologie', 'education']
    };

    if (thematiquesComplementaires[projetA.thematique]?.includes(projetB.thematique)) {
      score += 0.2;
    }

    // Bonus pour la qualité des projets
    const qualiteMoyenne = ((projetA.score_qualite_pitch || 0.5) + (projetB.score_qualite || 0.5)) / 2;
    score += qualiteMoyenne * 0.3;

    return Math.min(score, 1.0);
  }
}

module.exports = MiseEnCorrespondanceService;

