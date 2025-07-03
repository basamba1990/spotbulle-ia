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
    async transcribeVideo(videoPath) {
        let localVideoPath = videoPath;
        let cleanupRequired = false;

        // Si c'est une URL, télécharger d'abord la vidéo
        if (videoPath.startsWith('http')) {
            const tempDir = path.join(__dirname, '..', '..', 'temp');
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir);
            }
            localVideoPath = path.join(tempDir, `video_${Date.now()}.mp4`);
            console.log(`Téléchargement de la vidéo depuis ${videoPath} vers ${localVideoPath}`);
            await this.downloadFile(videoPath, localVideoPath);
            cleanupRequired = true;
        }

        try {
            if (this.openaiApiKey) {
                console.log(`Transcription de l'audio de ${localVideoPath} avec OpenAI Whisper...`);
                // Utiliser fluent-ffmpeg pour extraire l'audio
                const audioPath = path.join(path.dirname(localVideoPath), `audio_${Date.now()}.mp3`);
                await new Promise((resolve, reject) => {
                    ffmpeg(localVideoPath)
                        .noVideo()
                        .audioCodec('libmp3lame')
                        .save(audioPath)
                        .on('end', () => {
                            console.log('Extraction audio terminée.');
                            resolve();
                        })
                        .on('error', (err) => {
                            console.error('Erreur lors de l\'extraction audio:', err);
                            reject(err);
                        });
                });

                const transcription = await this.callOpenAIAudioTranscription(audioPath);
                fs.unlinkSync(audioPath); // Supprimer le fichier audio temporaire
                return transcription;
            } else {
                console.log('Mode fallback: Simulation de transcription audio.');
                return "Ceci est une transcription simulée du contenu vidéo.";
            }
        } catch (error) {
            console.error('Erreur lors de la transcription vidéo:', error);
            if (this.openaiApiKey) {
                console.warn('Tentative de transcription OpenAI échouée, utilisation du mode fallback.');
                return "Ceci est une transcription simulée du contenu vidéo en raison d'une erreur.";
            } else {
                throw error; // Si le fallback est déjà actif, propager l'erreur
            }
        } finally {
            if (cleanupRequired && fs.existsSync(localVideoPath)) {
                fs.unlinkSync(localVideoPath); // Supprimer le fichier vidéo temporaire
                console.log(`Fichier temporaire ${localVideoPath} supprimé.`);
            }
        }
    }

    /**
     * Appelle l'API OpenAI pour la transcription audio.
     * @param {string} audioPath - Chemin vers le fichier audio.
     * @returns {Promise<string>} - Texte transcrit.
     */
    async callOpenAIAudioTranscription(audioPath) {
        const OpenAI = require('openai');
        const openai = new OpenAI({
            apiKey: this.openaiApiKey,
        });

        const transcription = await openai.audio.transcriptions.create({
            file: fs.createReadStream(audioPath),
            model: "whisper-1",
        });
        return transcription.text;
    }

    /**
     * Extrait les mots-clés d'un texte.
     * @param {string} text - Texte à analyser.
     * @returns {Promise<string[]>} - Liste de mots-clés.
     */
    async extractKeywords(text) {
        try {
            if (this.nlpCloudApiKey) {
                console.log('Extraction de mots-clés avec NLP Cloud...');
                const response = await axios.post('https://api.nlpcloud.io/v1/nlu/keywords', {
                    text: text,
                    lang: 'fr'
                }, {
                    headers: {
                        'Authorization': `Token ${this.nlpCloudApiKey}`,
                        'Content-Type': 'application/json'
                    }
                });
                return response.data.keywords.map(k => k.keyword);
            } else {
                console.log('Mode fallback: Extraction de mots-clés simple.');
                // Implémentation simple de l'extraction de mots-clés (fréquence des mots)
                const words = text.toLowerCase().match(/\b\w+\b/g);
                if (!words) return [];

                const wordCounts = {};
                words.forEach(word => {
                    wordCounts[word] = (wordCounts[word] || 0) + 1;
                });

                const sortedWords = Object.keys(wordCounts).sort((a, b) => wordCounts[b] - wordCounts[a]);
                return sortedWords.slice(0, 10); // Retourne les 10 mots les plus fréquents
            }
        } catch (error) {
            console.error('Erreur lors de l\'extraction de mots-clés:', error);
            if (this.nlpCloudApiKey) {
                console.warn('Tentative d\'extraction de mots-clés NLP Cloud échouée, utilisation du mode fallback.');
                return this.extractKeywordsFallback(text); // Utiliser la fonction fallback
            } else {
                throw error; // Si le fallback est déjà actif, propager l'erreur
            }
        }
    }

    extractKeywordsFallback(text) {
        const words = text.toLowerCase().match(/\b\w+\b/g);
        if (!words) return [];

        const wordCounts = {};
        words.forEach(word => {
            wordCounts[word] = (wordCounts[word] || 0) + 1;
        });

        const sortedWords = Object.keys(wordCounts).sort((a, b) => wordCounts[b] - wordCounts[a]);
        return sortedWords.slice(0, 10); // Retourne les 10 mots les plus fréquents
    }

    /**
     * Génère un résumé d'un texte.
     * @param {string} text - Texte à résumer.
     * @returns {Promise<string>} - Résumé du texte.
     */
    async generateSummary(text) {
        try {
            if (this.openaiApiKey) {
                console.log('Génération de résumé avec OpenAI GPT...');
                const OpenAI = require('openai');
                const openai = new OpenAI({
                    apiKey: this.openaiApiKey,
                });

                const completion = await openai.chat.completions.create({
                    model: "gpt-3.5-turbo",
                    messages: [
                        { "role": "system", "content": "Vous êtes un assistant qui résume des textes de manière concise et informative." },
                        { "role": "user", "content": `Veuillez résumer le texte suivant: ${text}` }
                    ],
                    max_tokens: 150
                });
                return completion.choices[0].message.content;
            } else {
                console.log('Mode fallback: Résumé basé sur les premières phrases.');
                // Implémentation simple de résumé (premières phrases)
                const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
                return sentences.slice(0, Math.min(3, sentences.length)).join(' ');
            }
        } catch (error) {
            console.error('Erreur lors de la génération de résumé:', error);
            if (this.openaiApiKey) {
                console.warn('Tentative de résumé OpenAI échouée, utilisation du mode fallback.');
                return this.generateSummaryFallback(text); // Utiliser la fonction fallback
            } else {
                throw error; // Si le fallback est déjà actif, propager l'erreur
            }
        }
    }

    generateSummaryFallback(text) {
        const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
        return sentences.slice(0, Math.min(3, sentences.length)).join(' ');
    }

    /**
     * Calcule l'embedding d'un texte.
     * @param {string} text - Texte pour lequel calculer l'embedding.
     * @returns {Promise<number[]>} - Vecteur d'embedding.
     */
    async generateEmbedding(text) {
        try {
            if (this.openaiApiKey) {
                console.log('Génération d\'embedding avec OpenAI...');
                const OpenAI = require('openai');
                const openai = new OpenAI({
                    apiKey: this.openaiApiKey,
                });

                const response = await openai.embeddings.create({
                    model: "text-embedding-ada-002",
                    input: text,
                });
                return response.data[0].embedding;
            } else {
                console.log('Mode fallback: Génération d\'embedding simulée.');
                // Générer un embedding simulé (vecteur de zéros ou aléatoire)
                return Array(1536).fill(0); // Taille typique pour text-embedding-ada-002
            }
        } catch (error) {
            console.error('Erreur lors de la génération d\'embedding:', error);
            if (this.openaiApiKey) {
                console.warn('Tentative d\'embedding OpenAI échouée, utilisation du mode fallback.');
                return Array(1536).fill(0); // Retourner un vecteur de zéros en cas d'échec
            } else {
                throw error; // Si le fallback est déjà actif, propager l'erreur
            }
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
}

module.exports = AnalyseIAService;


