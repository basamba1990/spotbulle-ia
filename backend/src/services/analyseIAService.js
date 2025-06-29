const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const axios = require('axios');

class AnalyseIAService {
  constructor() {
    this.openaiApiKey = process.env.OPENAI_API_KEY;
    this.nlpCloudApiKey = process.env.NLPCLOUD_API_KEY;
    
    if (!this.openaiApiKey) {
      console.warn('OPENAI_API_KEY non configurée. La transcription sera désactivée.');
    }
    
    if (!this.nlpCloudApiKey) {
      console.warn('NLPCLOUD_API_KEY non configurée. L\'analyse NLP sera limitée.');
    }
  }

  /**
   * Télécharge un fichier depuis une URL et le sauvegarde localement.
   * @param {string} fileUrl - URL du fichier à télécharger.
   * @param {string} outputPath - Chemin où sauvegarder le fichier localement.
   * @returns {Promise<string>} - Chemin du fichier téléchargé.
   */
  async downloadFile(fileUrl, outputPath) {
    const writer = fs.createWriteStream(outputPath);
    const response = await axios({
      url: fileUrl,
      method: 'GET',
      responseType: 'stream'
    });

    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', () => resolve(outputPath));
      writer.on('error', reject);
    });
  }

  /**
   * Extrait l'audio d'une vidéo et la transcrit en texte
   * @param {string} videoPath - Chemin vers le fichier vidéo (peut être une URL ou un chemin local)
   * @returns {Promise<string>} - Transcription du contenu audio
   */
  async transcrireVideo(videoPath) {
    let localVideoPath = videoPath;
    let cleanupRequired = false;

    try {
      // Si videoPath est une URL, télécharger le fichier localement
      if (videoPath.startsWith('http://') || videoPath.startsWith('https://')) {
        const fileName = path.basename(videoPath);
        localVideoPath = path.join('/tmp', fileName); // Utiliser un répertoire temporaire
        console.log(`Téléchargement de la vidéo depuis ${videoPath} vers ${localVideoPath}`);
        await this.downloadFile(videoPath, localVideoPath);
        cleanupRequired = true;
      }

      // Vérifier que le fichier existe localement
      if (!fs.existsSync(localVideoPath)) {
        throw new Error(`Fichier vidéo non trouvé: ${localVideoPath}`);
      }

      // Utiliser OpenAI Whisper API pour la transcription
      const formData = new FormData();
      formData.append('file', fs.createReadStream(localVideoPath));
      formData.append('model', 'whisper-1');
      formData.append('language', 'fr'); // Français
      formData.append('response_format', 'text');

      const response = await axios.post(
        'https://api.openai.com/v1/audio/transcriptions',
        formData,
        {
          headers: {
            'Authorization': `Bearer ${this.openaiApiKey}`,
            ...formData.getHeaders()
          },
          timeout: 120000 // 2 minutes timeout
        }
      );

      return response.data.trim();
    } catch (error) {
      console.error('Erreur lors de la transcription:', error.message);
      
      // Fallback: retourner une transcription simulée pour les tests
      if (process.env.NODE_ENV === 'development') {
        return this.genererTranscriptionSimulee();
      }
      
      throw new Error(`Échec de la transcription: ${error.message}`);
    } finally {
      // Nettoyer le fichier temporaire si nécessaire
      if (cleanupRequired && fs.existsSync(localVideoPath)) {
        fs.unlink(localVideoPath, (err) => {
          if (err) console.error(`Erreur lors de la suppression du fichier temporaire ${localVideoPath}:`, err);
          else console.log(`Fichier temporaire supprimé: ${localVideoPath}`);
        });
      }
    }
  }

  /**
   * Extrait les mots-clés d'un texte
   * @param {string} texte - Texte à analyser
   * @returns {Promise<Array>} - Liste des mots-clés avec scores
   */
  async extraireMotsCles(texte) {
    try {
      if (!texte || texte.trim().length < 10) {
        return [];
      }

      // Utiliser NLP Cloud pour l'extraction de mots-clés
      if (this.nlpCloudApiKey) {
        const response = await axios.post(
          'https://api.nlpcloud.io/v1/finetuned-gpt-neox-20b/keywords',
          { text: texte },
          {
            headers: {
              'Authorization': `Token ${this.nlpCloudApiKey}`,
              'Content-Type': 'application/json'
            },
            timeout: 30000
          }
        );

        return response.data.keywords || [];
      }

      // Fallback: extraction simple basée sur la fréquence des mots
      return this.extraireMotsClesSimple(texte);
    } catch (error) {
      console.error('Erreur lors de l\'extraction de mots-clés:', error.message);
      return this.extraireMotsClesSimple(texte);
    }
  }

  /**
   * Génère un résumé automatique du texte
   * @param {string} texte - Texte à résumer
   * @returns {Promise<string>} - Résumé du texte
   */
  async genererResume(texte) {
    try {
      if (!texte || texte.trim().length < 50) {
        return '';
      }

      // Utiliser OpenAI GPT pour le résumé
      if (this.openaiApiKey) {
        const response = await axios.post(
          'https://api.openai.com/v1/chat/completions',
          {
            model: 'gpt-3.5-turbo',
            messages: [
              {
                role: 'system',
                content: 'Tu es un assistant qui résume des pitchs de projets en français. Crée un résumé concis en 2-3 phrases qui capture l\'essentiel du projet présenté.'
              },
              {
                role: 'user',
                content: `Résume ce pitch de projet: ${texte}`
              }
            ],
            max_tokens: 150,
            temperature: 0.3
          },
          {
            headers: {
              'Authorization': `Bearer ${this.openaiApiKey}`,
              'Content-Type': 'application/json'
            },
            timeout: 30000
          }
        );

        return response.data.choices[0].message.content.trim();
      }

      // Fallback: résumé simple
      return this.genererResumeSimple(texte);
    } catch (error) {
      console.error('Erreur lors de la génération du résumé:', error.message);
      return this.genererResumeSimple(texte);
    }
  }

  /**
   * Génère un embedding vectoriel pour le texte
   * @param {string} texte - Texte à vectoriser
   * @returns {Promise<Array>} - Vecteur d'embedding
   */
  async genererEmbedding(texte) {
    try {
      if (!texte || texte.trim().length < 10) {
        return [];
      }

      // Utiliser OpenAI Embeddings API
      if (this.openaiApiKey) {
        const response = await axios.post(
          'https://api.openai.com/v1/embeddings',
          {
            model: 'text-embedding-ada-002',
            input: texte
          },
          {
            headers: {
              'Authorization': `Bearer ${this.openaiApiKey}`,
              'Content-Type': 'application/json'
            },
            timeout: 30000
          }
        );

        return response.data.data[0].embedding;
      }

      // Fallback: embedding simulé
      return this.genererEmbeddingSimule(texte);
    } catch (error) {
      console.error('Erreur lors de la génération d\'embedding:', error.message);
      return this.genererEmbeddingSimule(texte);
    }
  }

  /**
   * Analyse complète d'une vidéo
   * @param {string} videoPath - Chemin vers le fichier vidéo
   * @returns {Promise<Object>} - Résultats de l'analyse
   */
  async analyserVideo(videoPath) {
    const resultats = {
      transcription: '',
      mots_cles: [],
      resume: '',
      embedding: [],
      score_qualite: 0,
      entites_nommees: [],
      statut: 'echec'
    };

    try {
      // Étape 1: Transcription
      console.log('Transcription en cours...');
      resultats.transcription = await this.transcrireVideo(videoPath);

      if (!resultats.transcription) {
        throw new Error('Transcription vide');
      }

      // Étape 2: Extraction de mots-clés
      console.log('Extraction des mots-clés...');
      resultats.mots_cles = await this.extraireMotsCles(resultats.transcription);

      // Étape 3: Génération du résumé
      console.log('Génération du résumé...');
      resultats.resume = await this.genererResume(resultats.transcription);

      // Étape 4: Génération de l'embedding
      console.log('Génération de l\'embedding...');
      resultats.embedding = await this.genererEmbedding(resultats.transcription);

      // Étape 5: Calcul du score de qualité (basique)
      resultats.score_qualite = this.calculerScoreQualite(resultats.transcription, resultats.mots_cles);

      // Étape 6: Extraction d'entités nommées (basique)
      resultats.entites_nommees = this.extraireEntitesNommees(resultats.transcription);

      resultats.statut = 'complete';
      console.log('Analyse IA terminée avec succès');

    } catch (error) {
      console.error('Erreur lors de l\'analyse IA:', error.message);
      resultats.statut = 'echec';
      resultats.erreur = error.message;
    }

    return resultats;
  }

  // Méthodes utilitaires et fallbacks

  genererTranscriptionSimulee() {
    const transcriptions = [
      "Bonjour, je vous présente notre projet innovant dans le domaine de la technologie. Notre solution révolutionnaire permettra de transformer la façon dont les entreprises gèrent leurs données. Nous avons développé une plateforme qui utilise l'intelligence artificielle pour optimiser les processus métier.",
      "Notre startup se concentre sur l'éducation numérique. Nous proposons une application mobile qui aide les étudiants à apprendre plus efficacement grâce à des méthodes d'apprentissage personnalisées. Notre équipe est composée d'experts en pédagogie et en développement.",
      "Je présente aujourd'hui un projet dans le secteur de la santé. Notre dispositif médical connecté permet de surveiller en temps réel les paramètres vitaux des patients. Cette innovation pourrait révolutionner le suivi médical à domicile."
    ];
    return transcriptions[Math.floor(Math.random() * transcriptions.length)];
  }

  extraireMotsClesSimple(texte) {
    const motsCles = [];
    const mots = texte.toLowerCase().split(/\W+/);
    const compteur = {};
    
    // Mots vides à ignorer
    const motsVides = new Set(['le', 'la', 'les', 'un', 'une', 'des', 'de', 'du', 'et', 'ou', 'mais', 'donc', 'car', 'ni', 'or', 'à', 'dans', 'par', 'pour', 'en', 'vers', 'avec', 'sans', 'sous', 'sur', 'ce', 'cette', 'ces', 'mon', 'ma', 'mes', 'ton', 'ta', 'tes', 'son', 'sa', 'ses', 'notre', 'nos', 'votre', 'vos', 'leur', 'leurs', 'je', 'tu', 'il', 'elle', 'nous', 'vous', 'ils', 'elles', 'qui', 'que', 'quoi', 'dont', 'où', 'est', 'sont', 'était', 'étaient', 'sera', 'seront', 'avoir', 'être', 'faire', 'aller', 'venir', 'voir', 'savoir', 'pouvoir', 'vouloir', 'devoir']);

    mots.forEach(mot => {
      if (mot.length > 3 && !motsVides.has(mot)) {
        compteur[mot] = (compteur[mot] || 0) + 1;
      }
    });

    // Trier par fréquence et prendre les 10 premiers
    Object.entries(compteur)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .forEach(([mot, freq]) => {
        motsCles.push({
          keyword: mot,
          score: freq / mots.length
        });
      });

    return motsCles;
  }

  genererResumeSimple(texte) {
    const phrases = texte.split(/[.!?]+/).filter(p => p.trim().length > 10);
    if (phrases.length <= 2) return texte;
    
    // Prendre les 2 premières phrases comme résumé
    return phrases.slice(0, 2).join('. ').trim() + '.';
  }

  genererEmbeddingSimule(texte) {
    // Générer un vecteur simulé de 1536 dimensions (taille d'OpenAI ada-002)
    const dimension = 1536;
    const embedding = [];
    
    // Utiliser le hash du texte comme seed pour la reproductibilité
    let seed = 0;
    for (let i = 0; i < texte.length; i++) {
      seed += texte.charCodeAt(i);
    }
    
    for (let i = 0; i < dimension; i++) {
      // Générer des nombres pseudo-aléatoires basés sur le seed
      seed = (seed * 9301 + 49297) % 233280;
      embedding.push((seed / 233280 - 0.5) * 2); // Normaliser entre -1 et 1
    }
    
    return embedding;
  }

  calculerScoreQualite(transcription, motsCles) {
    let score = 0.5; // Score de base
    
    // Bonus pour la longueur (pitchs plus longs généralement plus détaillés)
    if (transcription.length > 500) score += 0.1;
    if (transcription.length > 1000) score += 0.1;
    
    // Bonus pour le nombre de mots-clés
    if (motsCles.length > 5) score += 0.1;
    if (motsCles.length > 10) score += 0.1;
    
    // Bonus pour la présence de mots-clés business
    const motsBusiness = ['projet', 'solution', 'innovation', 'marché', 'client', 'équipe', 'financement', 'revenus'];
    const motsTrouves = motsBusiness.filter(mot => 
      transcription.toLowerCase().includes(mot)
    );
    score += motsTrouves.length * 0.05;
    
    return Math.min(score, 1.0); // Limiter à 1.0
  }

  extraireEntitesNommees(texte) {
    const entites = [];
    
    // Extraction basique d'entités (noms propres)
    const motsCapitalises = texte.match(/\b[A-Z][a-z]+\b/g) || [];
    const entitesUniques = [...new Set(motsCapitalises)];
    
    entitesUniques.forEach(entite => {
      entites.push({
        text: entite,
        type: 'PERSON', // Type par défaut
        confidence: 0.7
      });
    });
    
    return entites.slice(0, 10); // Limiter à 10 entités
  }
}

module.exports = AnalyseIAService;


