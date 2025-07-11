import axios from 'axios';

// Configuration de l'API pour la production
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://10000-i8x5si7p653y7yz9s86s8-6fca0c3c.manusvm.computer';
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

// Intercepteur de réponse avec gestion d'erreurs robuste
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

    // Gestion des erreurs de réseau
    if (!error.response) {
      console.error('❌ Erreur de réseau:', error.message);
      
      // Vérifier la connectivité
      try {
        await fetch(`${API_BASE_URL}/health`, { method: 'HEAD', mode: 'no-cors' });
      } catch (connectivityError) {
        throw new Error('Impossible de joindre le serveur. Vérifiez votre connexion internet.');
      }
      
      throw new Error('Erreur de réseau. Veuillez réessayer.');
    }

    // Gestion des erreurs d'authentification
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // Supprimer le token invalide
      localStorage.removeItem('authToken');
      
      // Rediriger vers la page de connexion
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login';
      }
      
      throw new Error('Session expirée. Veuillez vous reconnecter.');
    }

    // Gestion des erreurs de serveur
    if (error.response.status >= 500) {
      console.error('❌ Erreur serveur:', error.response.status, error.response.data);
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

// API Functions

/**
 * Vérifier la santé du serveur
 */
export const checkHealth = async () => {
  try {
    const response = await api.get('/health');
    return response.data;
  } catch (error) {
    console.error('❌ Erreur health check:', error.message);
    throw error;
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
      const response = await api.get('/auth/me');
      return response.data;
    } catch (error) {
      console.error('❌ Erreur récupération utilisateur:', error.message);
      throw error;
    }
  }
};

/**
 * Gestion des vidéos
 */
export const videos = {
  getAll: async (params = {}) => {
    try {
      const response = await api.get('/videos', { params });
      return response.data;
    } catch (error) {
      console.error('❌ Erreur récupération vidéos:', error.message);
      throw error;
    }
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
 * Analyse IA
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
      throw error;
    }
  },

  getStatistics: async () => {
    try {
      const response = await api.get('/ia/statistiques');
      return response.data;
    } catch (error) {
      console.error('❌ Erreur récupération statistiques IA:', error.message);
      throw error;
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
      throw error;
    }
  }
};

/**
 * Gestion des événements
 */
export const events = {
  getAll: async (params = {}) => {
    try {
      const response = await api.get('/events', { params });
      return response.data;
    } catch (error) {
      console.error('❌ Erreur récupération événements:', error.message);
      throw error;
    }
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

// Utilitaires API
export const apiUtils = {
  validateFile,
  checkHealth,
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
  getEnvironment: () => ENVIRONMENT
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

