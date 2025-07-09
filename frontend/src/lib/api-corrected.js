import axios from 'axios';

// Configuration de l'API pour la production avec fallback
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://spotbulle-ia.onrender.com';
const MAX_FILE_SIZE = parseInt(process.env.NEXT_PUBLIC_MAX_FILE_SIZE) || 262144000; // 250MB
const ENVIRONMENT = process.env.NEXT_PUBLIC_ENV || 'production';

console.log(`🌍 Configuration API - Environnement: ${ENVIRONMENT}`);
console.log(`🔗 URL de base: ${API_BASE_URL}`);
console.log(`📁 Taille max fichier: ${(MAX_FILE_SIZE / 1024 / 1024).toFixed(0)}MB`);

// Configuration axios avec intercepteurs pour la production
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000, // 2 minutes pour les uploads
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'X-Client-Version': '1.1.1',
    'X-Environment': ENVIRONMENT
  }
});

// Intercepteur de requête
api.interceptors.request.use(
  (config) => {
    // Ajouter le token d'authentification si disponible
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Log des requêtes en développement
    if (ENVIRONMENT === 'development') {
      console.log(`🚀 Requête: ${config.method?.toUpperCase()} ${config.url}`);
    }

    return config;
  },
  (error) => {
    console.error('❌ Erreur de configuration de requête:', error);
    return Promise.reject(error);
  }
);

// Intercepteur de réponse avec gestion d'erreurs robuste et fallback
api.interceptors.response.use(
  (response) => {
    // Log des réponses en développement
    if (ENVIRONMENT === 'development') {
      console.log(`✅ Réponse: ${response.status} ${response.config.url}`);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Gestion des erreurs de réseau avec fallback
    if (!error.response) {
      console.warn('⚠️ Erreur de réseau:', error.message);
      
      // Retourner des données par défaut pour certaines routes
      if (originalRequest.url?.includes('/videos')) {
        return {
          data: {
            videos: [],
            message: 'Mode hors ligne - Aucune vidéo disponible'
          }
        };
      }
      
      if (originalRequest.url?.includes('/events')) {
        return {
          data: {
            events: [],
            message: 'Mode hors ligne - Aucun événement disponible'
          }
        };
      }
      
      throw new Error('Connexion au serveur impossible. Vérifiez votre connexion internet.');
    }

    // Gestion des erreurs d'authentification
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // Supprimer le token invalide
      localStorage.removeItem('authToken');
      
      // Rediriger vers la page de connexion seulement si on est dans le navigateur
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
      
      throw new Error('Session expirée. Veuillez vous reconnecter.');
    }

    // Gestion des erreurs de serveur avec fallback gracieux
    if (error.response.status >= 500) {
      console.error('❌ Erreur serveur:', error.response.status, error.response.data);
      
      // Retourner des données par défaut pour les requêtes GET
      if (originalRequest.method?.toLowerCase() === 'get') {
        if (originalRequest.url?.includes('/videos')) {
          return {
            data: {
              videos: [],
              message: 'Erreur serveur - Impossible de charger les vidéos'
            }
          };
        }
        
        if (originalRequest.url?.includes('/events')) {
          return {
            data: {
              events: [],
              message: 'Erreur serveur - Impossible de charger les événements'
            }
          };
        }
      }
      
      throw new Error('Erreur du serveur. Veuillez réessayer plus tard.');
    }

    // Gestion des erreurs de validation
    if (error.response.status === 400) {
      const errorMessage = error.response.data?.message || 'Données invalides';
      throw new Error(errorMessage);
    }

    // Gestion des erreurs de permissions
    if (error.response.status === 403) {
      throw new Error('Accès non autorisé à cette ressource.');
    }

    // Gestion des erreurs de ressource non trouvée
    if (error.response.status === 404) {
      throw new Error('Ressource non trouvée.');
    }

    // Gestion des erreurs de limite de taux
    if (error.response.status === 429) {
      throw new Error('Trop de requêtes. Veuillez patienter avant de réessayer.');
    }

    // Erreur générique
    const errorMessage = error.response.data?.message || error.message || 'Une erreur est survenue';
    throw new Error(errorMessage);
  }
);

// Fonction utilitaire pour valider les fichiers
const validateFile = (file) => {
  const errors = [];

  // Vérifier la taille
  if (file.size > MAX_FILE_SIZE) {
    errors.push(`Le fichier est trop volumineux (max: ${(MAX_FILE_SIZE / 1024 / 1024).toFixed(0)}MB)`);
  }

  // Vérifier le type
  const allowedTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'];
  if (!allowedTypes.includes(file.type)) {
    errors.push('Format de fichier non supporté. Utilisez MP4, MOV, AVI ou WebM.');
  }

  // Vérifier le nom du fichier
  if (file.name.length > 255) {
    errors.push('Le nom du fichier est trop long (max: 255 caractères)');
  }

  // Vérifier les caractères spéciaux
  const invalidChars = /[<>:"/\\|?*]/;
  if (invalidChars.test(file.name)) {
    errors.push('Le nom du fichier contient des caractères non autorisés');
  }

  return errors;
};

// Fonction utilitaire pour gérer les erreurs
const handleError = (error) => {
  if (error.response) {
    return {
      status: error.response.status,
      message: error.response.data?.message || error.message,
      data: error.response.data
    };
  } else if (error.request) {
    return {
      status: 0,
      message: 'Erreur de réseau - Impossible de joindre le serveur',
      data: null
    };
  } else {
    return {
      status: -1,
      message: error.message || 'Une erreur inconnue est survenue',
      data: null
    };
  }
};

// Fonction utilitaire pour formater les dates
const formatDate = (dateString) => {
  if (!dateString) return 'Date inconnue';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    return 'Date invalide';
  }
};

// API Functions

/**
 * Vérifier la santé du serveur
 */
export const checkHealth = async () => {
  try {
    const response = await api.get('/health');
    return response.data;
  } catch (error) {
    console.warn('⚠️ Health check échoué:', error.message);
    return { status: 'offline', message: 'Serveur indisponible' };
  }
};

/**
 * Authentification
 */
export const auth = {
  login: async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials);
      
      // Sauvegarder le token
      if (response.data.token) {
        localStorage.setItem('authToken', response.data.token);
      }
      
      return response.data;
    } catch (error) {
      console.error('❌ Erreur de connexion:', error.message);
      throw error;
    }
  },

  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      
      // Sauvegarder le token si fourni
      if (response.data.token) {
        localStorage.setItem('authToken', response.data.token);
      }
      
      return response.data;
    } catch (error) {
      console.error('❌ Erreur d\'inscription:', error.message);
      throw error;
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.warn('⚠️ Erreur lors de la déconnexion:', error.message);
    } finally {
      // Supprimer le token local
      localStorage.removeItem('authToken');
    }
  },

  getCurrentUser: async () => {
    try {
      const response = await api.get("/auth/me");
      return response.data;
    } catch (error) {
      console.error("❌ Erreur récupération utilisateur:", error.message);
      throw error;
    }
  },

  getUserStats: async (userId) => {
    try {
      const response = await api.get(`/users/${userId}/stats`);
      return response.data;
    } catch (error) {
      console.error(`❌ Erreur récupération statistiques utilisateur ${userId}:`, error.message);
      // Retourner des stats par défaut
      return {
        data: {
          videos_count: 0,
          total_views: 0,
          events_count: 0,
          followers_count: 0
        }
      };
    }
  },

  getUserVideos: async (userId, params = {}) => {
    try {
      const response = await api.get(`/users/${userId}/videos`, { params });
      return response.data;
    } catch (error) {
      console.error(`❌ Erreur récupération vidéos utilisateur ${userId}:`, error.message);
      return { data: { videos: [] } };
    }
  }
};

/**
 * Gestion des vidéos avec fallback
 */
export const videos = {
  getAll: async (params = {}) => {
    try {
      const response = await api.get('/videos', { params });
      return response.data;
    } catch (error) {
      console.warn('⚠️ Impossible de charger les vidéos:', error.message);
      return { data: { videos: [] } };
    }
  },

  getVideos: async (params = {}) => {
    return videos.getAll(params);
  },

  getById: async (id) => {
    try {
      const response = await api.get(`/videos/${id}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Erreur récupération vidéo ${id}:`, error.message);
      throw error;
    }
  },

  upload: async (file, metadata = {}, onProgress = null) => {
    try {
      // Validation du fichier
      const validationErrors = validateFile(file);
      if (validationErrors.length > 0) {
        throw new Error(validationErrors.join(', '));
      }

      console.log(`📤 Upload de ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);

      const formData = new FormData();
      formData.append('video', file);
      
      // Ajouter les métadonnées
      Object.keys(metadata).forEach(key => {
        formData.append(key, metadata[key]);
      });

      const response = await api.post('/videos/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 300000, // 5 minutes pour les gros fichiers
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(percentCompleted);
          }
        }
      });

      console.log('✅ Upload terminé avec succès');
      return response.data;
    } catch (error) {
      console.error('❌ Erreur upload vidéo:', error.message);
      throw error;
    }
  },

  delete: async (id) => {
    try {
      const response = await api.delete(`/videos/${id}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Erreur suppression vidéo ${id}:`, error.message);
      throw error;
    }
  }
};

/**
 * Analyse IA avec gestion d'erreur améliorée
 */
export const ia = {
  analyzeVideo: async (videoId) => {
    try {
      console.log(`🤖 Lancement de l'analyse IA pour la vidéo ${videoId}`);
      const response = await api.post(`/ia/analyser/${videoId}`, {}, {
        timeout: 180000 // 3 minutes pour l'analyse IA
      });
      
      console.log('✅ Analyse IA terminée');
      return response.data;
    } catch (error) {
      console.error(`❌ Erreur analyse IA vidéo ${videoId}:`, error.message);
      throw error;
    }
  },

  getAnalysis: async (videoId) => {
    try {
      const response = await api.get(`/ia/analyse/${videoId}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Erreur récupération analyse ${videoId}:`, error.message);
      return { data: { analysis: null, message: 'Analyse non disponible' } };
    }
  },

  getStatistics: async () => {
    try {
      const response = await api.get('/ia/statistiques');
      return response.data;
    } catch (error) {
      console.error('❌ Erreur récupération statistiques IA:', error.message);
      return { 
        data: { 
          total_analyses: 0, 
          success_rate: 0, 
          average_processing_time: 0 
        } 
      };
    }
  },

  searchSimilar: async (videoId, threshold = 0.6) => {
    try {
      const response = await api.get(`/ia/similaires/${videoId}`, {
        params: { threshold }
      });
      return response.data;
    } catch (error) {
      console.error(`❌ Erreur recherche similaires ${videoId}:`, error.message);
      return { data: { similar_videos: [] } };
    }
  }
};

/**
 * Gestion des événements avec fallback
 */
export const events = {
  getAll: async (params = {}) => {
    try {
      const response = await api.get('/events', { params });
      return response.data;
    } catch (error) {
      console.warn('⚠️ Impossible de charger les événements:', error.message);
      return { data: { events: [] } };
    }
  },

  getEvents: async (params = {}) => {
    return events.getAll(params);
  },

  getById: async (id) => {
    try {
      const response = await api.get(`/events/${id}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Erreur récupération événement ${id}:`, error.message);
      throw error;
    }
  },

  create: async (eventData) => {
    try {
      const response = await api.post('/events', eventData);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur création événement:', error.message);
      throw error;
    }
  },

  update: async (id, eventData) => {
    try {
      const response = await api.put(`/events/${id}`, eventData);
      return response.data;
    } catch (error) {
      console.error(`❌ Erreur mise à jour événement ${id}:`, error.message);
      throw error;
    }
  },

  delete: async (id) => {
    try {
      const response = await api.delete(`/events/${id}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Erreur suppression événement ${id}:`, error.message);
      throw error;
    }
  }
};

// Exports pour compatibilité avec l'ancien code
export const videoAPI = videos;
export const eventAPI = events;
export const authAPI = auth;
export const iaAPI = ia;

// Utilitaires API améliorés
export const apiUtils = {
  validateFile,
  checkHealth,
  handleError,
  formatDate,
  formatFileSize: (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },
  isValidVideoType: (file) => {
    const allowedTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'];
    return allowedTypes.includes(file.type);
  },
  getApiUrl: () => API_BASE_URL,
  getMaxFileSize: () => MAX_FILE_SIZE,
  getEnvironment: () => ENVIRONMENT,
  
  // Nouvelle fonction pour vérifier la connectivité
  isOnline: async () => {
    try {
      const health = await checkHealth();
      return health.status !== 'offline';
    } catch (error) {
      return false;
    }
  }
};

// Export de l'instance axios pour les cas d'usage avancés
export { api };

// Export par défaut
export default {
  checkHealth,
  auth,
  videos,
  ia,
  events,
  api,
  videoAPI: videos,
  eventAPI: events,
  authAPI: auth,
  iaAPI: ia,
  apiUtils
};

