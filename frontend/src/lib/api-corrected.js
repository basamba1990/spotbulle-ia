import axios from 'axios';

// Configuration de l'API avec fallback pour le développement local
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise(function(resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
        .then(token => {
          originalRequest.headers['Authorization'] = 'Bearer ' + token;
          return api(originalRequest);
        })
        .catch(err => {
          return Promise.reject(err);
        });
      }

      isRefreshing = true;

      return new Promise(async (resolve, reject) => {
        try {
          const refreshToken = localStorage.getItem('refreshToken');
          
          if (!refreshToken) {
            throw new Error('Refresh token non trouvé. Déconnexion.');
          }

          const refreshResponse = await axios.post(`${API_URL}/auth/refresh-token`, { refreshToken }, {
            withCredentials: true
          });
          
          const newToken = refreshResponse.data.data.token;
          const newRefreshToken = refreshResponse.data.data.refreshToken;
          
          localStorage.setItem('authToken', newToken);
          if (newRefreshToken) {
            localStorage.setItem('refreshToken', newRefreshToken);
          }

          api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
          processQueue(null, newToken);
          resolve(api(originalRequest));
        } catch (refreshError) {
          processQueue(refreshError, null);
          localStorage.removeItem('authToken');
          localStorage.removeItem('refreshToken');
          // Rediriger vers la page de connexion
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
          reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      });
    }

    return Promise.reject(error);
  }
);

// API d'authentification
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  refreshToken: (refreshToken) => api.post('/auth/refresh-token', { refreshToken }),
};

// API vidéo avec gestion d'erreurs améliorée
export const videoAPI = {
  uploadVideo: (formData, onUploadProgress) => {
    return api.post('/videos/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: onUploadProgress,
      timeout: 300000, // 5 minutes pour l'upload
    });
  },
  getVideos: (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    return api.get(`/videos${queryParams ? `?${queryParams}` : ''}`);
  },
  getVideoById: (id) => api.get(`/videos/${id}`),
  deleteVideo: (id) => api.delete(`/videos/${id}`),
  updateVideo: (id, data) => api.put(`/videos/${id}`, data),
};

// API utilisateur
export const userAPI = {
  getUserStats: (userId) => api.get(`/users/${userId}/stats`),
  getUserVideos: (userId, params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    return api.get(`/users/${userId}/videos${queryParams ? `?${queryParams}` : ''}`);
  },
  updateProfile: (userId, data) => api.put(`/users/${userId}`, data),
};

// API événements
export const eventAPI = {
  getEvents: (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    return api.get(`/events${queryParams ? `?${queryParams}` : ''}`);
  },
  getEventById: (id) => api.get(`/events/${id}`),
  createEvent: (data) => api.post('/events', data),
  updateEvent: (id, data) => api.put(`/events/${id}`, data),
  deleteEvent: (id) => api.delete(`/events/${id}`),
};

// API IA avec gestion d'erreurs améliorée
export const iaAPI = {
  lancerAnalyse: (videoId) => api.post(`/ia/analyser/${videoId}`),
  obtenirResultats: (videoId) => api.get(`/ia/resultats/${videoId}`),
  rechercherSimilaires: (videoId, limit = 5) => api.get(`/ia/similaires/${videoId}?limit=${limit}`),
  obtenirStatistiques: () => api.get('/ia/statistiques'),
  obtenirRecommandations: (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    return api.get(`/ia/recommandations${queryParams ? `?${queryParams}` : ''}`);
  },
};

// Utilitaires API
export const apiUtils = {
  // Fonction pour les requêtes nécessitant une authentification
  authenticatedRequest: (method, url, data = {}) => {
    return api[method](url, data);
  },
  
  // Fonction pour les requêtes optionnellement authentifiées
  optionalAuthRequest: (method, url, data = {}) => {
    return api[method](url, data);
  },
  
  // Validation des fichiers vidéo améliorée
  validateVideoFile: (file) => {
    const allowedTypes = [
      'video/mp4',
      'video/avi', 
      'video/mov',
      'video/quicktime',
      'video/x-msvideo',
      'video/x-ms-wmv',
      'video/webm',
      'video/3gpp',
      'video/3gpp2'
    ];
    
    const allowedExtensions = ['.mp4', '.avi', '.mov', '.wmv', '.webm', '.3gp', '.3g2'];
    
    const maxSize = parseInt(process.env.NEXT_PUBLIC_MAX_FILE_SIZE) || 104857600; // 100MB
    
    if (!file) {
      throw new Error('Aucun fichier sélectionné');
    }
    
    // Vérifier la taille
    if (file.size > maxSize) {
      throw new Error(`Le fichier est trop volumineux. Taille maximum: ${apiUtils.formatFileSize(maxSize)}`);
    }
    
    // Vérifier le type MIME
    if (!allowedTypes.includes(file.type)) {
      // Vérifier l'extension si le type MIME n'est pas reconnu
      const fileName = file.name.toLowerCase();
      const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));
      
      if (!hasValidExtension) {
        throw new Error('Type de fichier non autorisé. Formats acceptés : MP4, MOV, QuickTime, AVI, WMV, WebM, 3GP, 3G2');
      }
    }
    
    // Vérifications supplémentaires
    if (file.name.length > 255) {
      throw new Error('Le nom du fichier est trop long (maximum 255 caractères)');
    }
    
    return true;
  },
  
  // Formater la taille des fichiers
  formatFileSize: (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },
  
  // Gestion des erreurs améliorée
  handleError: (error) => {
    console.error('Erreur API:', error);
    
    if (error.response) {
      // Erreur de réponse du serveur
      const status = error.response.status;
      const data = error.response.data;
      
      let message = data?.message || 'Erreur du serveur';
      
      switch (status) {
        case 400:
          message = data?.message || 'Données invalides';
          break;
        case 401:
          message = 'Non autorisé. Veuillez vous reconnecter.';
          break;
        case 403:
          message = 'Accès interdit';
          break;
        case 404:
          message = 'Ressource non trouvée';
          break;
        case 409:
          message = data?.message || 'Conflit de données';
          break;
        case 413:
          message = 'Fichier trop volumineux';
          break;
        case 429:
          message = 'Trop de requêtes. Veuillez patienter.';
          break;
        case 500:
          message = 'Erreur interne du serveur';
          break;
        case 503:
          message = 'Service temporairement indisponible';
          break;
        default:
          message = `Erreur ${status}: ${message}`;
      }
      
      return {
        message,
        status,
        data,
        errors: data?.errors || []
      };
    } else if (error.request) {
      // Erreur de réseau
      return {
        message: 'Impossible de contacter le serveur. Vérifiez votre connexion internet.',
        status: 0,
        data: null,
        errors: []
      };
    } else {
      // Autre erreur
      return {
        message: error.message || 'Une erreur inattendue est survenue',
        status: 0,
        data: null,
        errors: []
      };
    }
  },
  
  // Formater les dates
  formatDate: (dateString) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now - date);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        return 'hier';
      } else if (diffDays < 7) {
        return `il y a ${diffDays} jours`;
      } else if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7);
        return `il y a ${weeks} semaine${weeks > 1 ? 's' : ''}`;
      } else {
        return date.toLocaleDateString('fr-FR', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        });
      }
    } catch (error) {
      return dateString;
    }
  },
  
  // Vérifier la connectivité
  checkConnectivity: async () => {
    try {
      const response = await api.get('/health', { timeout: 5000 });
      return response.status === 200;
    } catch (error) {
      return false;
    }
  },
  
  // Retry automatique pour les requêtes échouées
  retryRequest: async (requestFn, maxRetries = 3, delay = 1000) => {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await requestFn();
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        
        // Attendre avant de réessayer
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
      }
    }
  }
};

export default api;

