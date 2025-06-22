const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

class AIAnalysisService {
  constructor() {
    // Configuration pour les services d'IA
    this.openaiApiKey = process.env.OPENAI_API_KEY;
    this.assemblyaiApiKey = process.env.ASSEMBLYAI_API_KEY;
  }

  /**
   * Transcrit l'audio d'une vidéo en utilisant AssemblyAI
   * @param {string} videoUrl - URL de la vidéo
   * @returns {Promise<string>} - Transcription du contenu audio
   */
  async transcribeVideo(videoUrl) {
    try {
      if (!this.assemblyaiApiKey) {
        throw new Error('Clé API AssemblyAI manquante');
      }

      // Étape 1: Soumettre l'URL pour transcription
      const uploadResponse = await axios.post(
        'https://api.assemblyai.com/v2/transcript',
        {
          audio_url: videoUrl,
          language_code: 'fr' // Français
        },
        {
          headers: {
            'Authorization': this.assemblyaiApiKey,
            'Content-Type': 'application/json'
          }
        }
      );

      const transcriptId = uploadResponse.data.id;

      // Étape 2: Attendre que la transcription soit terminée
      let transcriptResult;
      let attempts = 0;
      const maxAttempts = 60; // 5 minutes maximum

      do {
        await this.sleep(5000); // Attendre 5 secondes
        
        const statusResponse = await axios.get(
          `https://api.assemblyai.com/v2/transcript/${transcriptId}`,
          {
            headers: {
              'Authorization': this.assemblyaiApiKey
            }
          }
        );

        transcriptResult = statusResponse.data;
        attempts++;

        if (attempts >= maxAttempts) {
          throw new Error('Timeout lors de la transcription');
        }
      } while (transcriptResult.status === 'processing' || transcriptResult.status === 'queued');

      if (transcriptResult.status === 'error') {
        throw new Error(`Erreur de transcription: ${transcriptResult.error}`);
      }

      return transcriptResult.text || '';
    } catch (error) {
      console.error('Erreur lors de la transcription:', error);
      throw error;
    }
  }

  /**
   * Extrait les mots-clés et analyse le contenu avec OpenAI
   * @param {string} transcription - Texte transcrit
   * @returns {Promise<Object>} - Résultats de l'analyse
   */
  async analyzeContent(transcription) {
    try {
      if (!this.openaiApiKey) {
        throw new Error('Clé API OpenAI manquante');
      }

      if (!transcription || transcription.trim().length === 0) {
        return {
          mots_cles: [],
          score_pitch: 0,
          sentiment: { positif: 0, negatif: 0, neutre: 1 },
          resume: 'Aucun contenu à analyser'
        };
      }

      const prompt = `
Analyse le texte suivant qui est la transcription d'un pitch vidéo et fournis:

1. Une liste de 5-10 mots-clés principaux
2. Un score de qualité du pitch sur 100 (clarté, structure, persuasion)
3. Une analyse de sentiment (scores entre 0 et 1 pour positif, négatif, neutre)
4. Un résumé en 2-3 phrases

Texte à analyser:
"${transcription}"

Réponds uniquement au format JSON suivant:
{
  "mots_cles": ["mot1", "mot2", ...],
  "score_pitch": 75,
  "sentiment": {
    "positif": 0.7,
    "negatif": 0.1,
    "neutre": 0.2
  },
  "resume": "Résumé du pitch..."
}`;

      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'Tu es un expert en analyse de pitchs et de contenu vidéo. Réponds uniquement en JSON valide.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 1000,
          temperature: 0.3
        },
        {
          headers: {
            'Authorization': `Bearer ${this.openaiApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const content = response.data.choices[0].message.content;
      
      try {
        return JSON.parse(content);
      } catch (parseError) {
        console.error('Erreur de parsing JSON:', parseError);
        // Retour par défaut en cas d'erreur de parsing
        return {
          mots_cles: this.extractSimpleKeywords(transcription),
          score_pitch: 50,
          sentiment: { positif: 0.5, negatif: 0.2, neutre: 0.3 },
          resume: 'Analyse automatique non disponible'
        };
      }
    } catch (error) {
      console.error('Erreur lors de l\'analyse du contenu:', error);
      
      // Analyse de fallback simple
      return {
        mots_cles: this.extractSimpleKeywords(transcription),
        score_pitch: 50,
        sentiment: { positif: 0.5, negatif: 0.2, neutre: 0.3 },
        resume: 'Analyse simplifiée effectuée'
      };
    }
  }

  /**
   * Trouve des projets similaires basés sur les mots-clés
   * @param {Array} motsCles - Mots-clés de la vidéo actuelle
   * @param {string} videoId - ID de la vidéo actuelle (à exclure)
   * @param {Object} Video - Modèle Sequelize Video
   * @returns {Promise<Array>} - IDs des vidéos similaires
   */
  async findSimilarProjects(motsCles, videoId, Video) {
    try {
      if (!motsCles || motsCles.length === 0) {
        return [];
      }

      const { Op } = require('sequelize');

      // Rechercher des vidéos avec des mots-clés similaires
      const similarVideos = await Video.findAll({
        where: {
          id: { [Op.ne]: videoId }, // Exclure la vidéo actuelle
          statut: 'actif',
          mots_cles_ia: {
            [Op.overlap]: motsCles // Intersection des arrays
          }
        },
        attributes: ['id', 'titre', 'mots_cles_ia'],
        limit: 10
      });

      // Calculer un score de similarité simple
      const scoredVideos = similarVideos.map(video => {
        const intersection = video.mots_cles_ia.filter(mot => 
          motsCles.some(motActuel => 
            motActuel.toLowerCase().includes(mot.toLowerCase()) ||
            mot.toLowerCase().includes(motActuel.toLowerCase())
          )
        );
        
        const score = intersection.length / Math.max(motsCles.length, video.mots_cles_ia.length);
        
        return {
          id: video.id,
          score: score
        };
      });

      // Trier par score et retourner les IDs
      return scoredVideos
        .filter(video => video.score > 0.2) // Seuil minimum de similarité
        .sort((a, b) => b.score - a.score)
        .slice(0, 5) // Top 5
        .map(video => video.id);

    } catch (error) {
      console.error('Erreur lors de la recherche de projets similaires:', error);
      return [];
    }
  }

  /**
   * Extraction simple de mots-clés (fallback)
   * @param {string} text - Texte à analyser
   * @returns {Array} - Liste de mots-clés
   */
  extractSimpleKeywords(text) {
    if (!text) return [];

    // Mots vides à ignorer
    const stopWords = new Set([
      'le', 'la', 'les', 'un', 'une', 'des', 'du', 'de', 'et', 'ou', 'mais',
      'donc', 'car', 'ni', 'or', 'je', 'tu', 'il', 'elle', 'nous', 'vous',
      'ils', 'elles', 'ce', 'cette', 'ces', 'mon', 'ma', 'mes', 'ton', 'ta',
      'tes', 'son', 'sa', 'ses', 'notre', 'votre', 'leur', 'leurs', 'qui',
      'que', 'quoi', 'dont', 'où', 'dans', 'sur', 'avec', 'sans', 'pour',
      'par', 'vers', 'chez', 'depuis', 'pendant', 'avant', 'après', 'très',
      'plus', 'moins', 'aussi', 'encore', 'déjà', 'toujours', 'jamais'
    ]);

    // Nettoyer et diviser le texte
    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3 && !stopWords.has(word));

    // Compter les occurrences
    const wordCount = {};
    words.forEach(word => {
      wordCount[word] = (wordCount[word] || 0) + 1;
    });

    // Retourner les mots les plus fréquents
    return Object.entries(wordCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 8)
      .map(([word]) => word);
  }

  /**
   * Fonction utilitaire pour attendre
   * @param {number} ms - Millisecondes à attendre
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Analyse complète d'une vidéo
   * @param {Object} video - Instance du modèle Video
   * @returns {Promise<Object>} - Résultats complets de l'analyse
   */
  async analyzeVideo(video) {
    try {
      console.log(`Début de l'analyse IA pour la vidéo ${video.id}`);

      // Étape 1: Transcription
      const transcription = await this.transcribeVideo(video.url_video);
      
      // Étape 2: Analyse du contenu
      const analysis = await this.analyzeContent(transcription);
      
      // Étape 3: Recherche de projets similaires
      const Video = require('../models/Video');
      const similarProjects = await this.findSimilarProjects(
        analysis.mots_cles, 
        video.id, 
        Video
      );

      const results = {
        transcription_ia: transcription,
        mots_cles_ia: analysis.mots_cles,
        score_pitch: analysis.score_pitch,
        analyse_sentiment: analysis.sentiment,
        projets_correspondants: similarProjects,
        statut_analyse_ia: 'termine',
        date_analyse_ia: new Date()
      };

      console.log(`Analyse IA terminée pour la vidéo ${video.id}`);
      return results;

    } catch (error) {
      console.error(`Erreur lors de l'analyse IA de la vidéo ${video.id}:`, error);
      
      return {
        statut_analyse_ia: 'erreur',
        date_analyse_ia: new Date()
      };
    }
  }
}

module.exports = new AIAnalysisService();

