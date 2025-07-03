// src/lib/api.js
import axios from 'axios';
import Cookies from 'js-cookie';

// Définition de l'URL de base de l'API
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://spotbulle-ia.onrender.com/api';

// Instance Axios configurée avec l'URL de base et un timeout
const api = axios.create({
  baseURL: API_URL,
  timeout: 30000, // Timeout de 30 secondes pour les requêtes générales
  headers: {
    'Content-Type': 'application/json',
  },
});

// Variable pour suivre si une requête de rafraîchissement de token est en cours
let isRefreshing = false;
// File d'attente pour les requêtes qui doivent être rejouées après le rafraîchissement du token
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

// Intercepteur de requêtes : Ajoute le token d'authentification à chaque requête
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('auth-token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur de réponses : Gère les réponses et les erreurs HTTP de manière centralisée
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Si l'erreur est 401 et que ce n'est pas une requête de rafraîchissement de token
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Si une requête de rafraîchissement est déjà en cours, ajoute la requête originale à la file d'attente
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

      // Tente de rafraîchir le token
      return new Promise(async (resolve, reject) => {
        try {
          // Récupérer le refresh token depuis les cookies ou le localStorage si stocké là
          const refreshToken = Cookies.get('refresh-token'); // Assurez-vous que ce cookie est défini lors de la connexion
          
          if (!refreshToken) {
            throw new Error('Refresh token non trouvé');
          }

          const refreshResponse = await axios.post(`${API_URL}/auth/refresh-token`, { refreshToken }, {
            withCredentials: true // Important si le refresh token est aussi dans un cookie HTTP Only
          });
          const newToken = refreshResponse.data.data.token; // Assurez-vous que votre backend renvoie le nouveau token ici
          
          // Stocke le nouveau token d'accès
          Cookies.set('auth-token', newToken, { expires: 7 }); // Ou la durée de vie appropriée

          // Met à jour l'en-tête de la requête originale avec le nouveau token
          originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
          
          // Rejoue toutes les requêtes en attente
          processQueue(null, newToken);
          resolve(api(originalRequest));
        } catch (refreshError) {
          // Si le rafraîchissement échoue, déconnecte l'utilisateur
          processQueue(refreshError, null);
          Cookies.remove('auth-token');
          Cookies.remove('refresh-token'); // Supprimer aussi le refresh token
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
          reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      });
    }

    // Gestion des autres erreurs HTTP
    if (error.response) {
      const { status, data } = error.response;
      let errorMessage = data.message || `Erreur ${status} du serveur`;

      switch (status) {
        case 400:
          errorMessage = data.message || "Requête invalide.";
          break;
        case 401:
          // Si ce n'est pas une erreur de rafraîchissement, ou si le rafraîchissement a échoué
          errorMessage = data.message || "Session expirée ou non autorisée.";
          if (typeof window !== 'undefined') {
            Cookies.remove('auth-token');
            Cookies.remove('refresh-token');
            window.location.href = '/login';
          }
          break;
        case 403:
          errorMessage = data.message || "Accès refusé.";
          break;
        case 404:
          errorMessage = data.message || "Ressource non trouvée.";
          break;
        case 500:
          errorMessage = data.message || "Erreur interne du serveur. Veuillez réessayer plus tard.";
          break;
        default:
          errorMessage = data.message || `Une erreur inattendue est survenue (Code: ${status}).`;
      }
      console.error(`Erreur API (${status}):`, errorMessage, data.errors);
      return Promise.reject(error.response);
    } else if (error.request) {
      console.error("Erreur réseau: Aucune réponse reçue.", error.message);
      return Promise.reject(new Error("Erreur de connexion au serveur. Veuillez vérifier votre connexion internet."));
    } else {
      console.error("Erreur de configuration de la requête:", error.message);
      return Promise.reject(new Error("Erreur lors de la préparation de la requête."));
    }
  }
);

// --- API d'authentification ---
export const authAPI = {
  register: (userData) => api.post("/auth/register", userData),
  login: async (credentials) => {
    const response = await api.post("/auth/login", credentials);
    if (response.data && response.data.token) {
      Cookies.set('auth-token', response.data.token, { expires: 7 }); // Stocke le token pour 7 jours
      // Assurez-vous que votre backend renvoie aussi un refresh token lors de la connexion
      // et stockez-le ici, par exemple dans un cookie séparé
      if (response.data.data && response.data.data.refreshToken) {
        Cookies.set('refresh-token', response.data.data.refreshToken, { expires: 30, secure: true, sameSite: 'Lax' }); // Exemple: 30 jours, sécurisé
      }
    }
    return response;
  },
  logout: async () => {
    const response = await api.post('/auth/logout');
    Cookies.remove('auth-token');
    Cookies.remove('refresh-token');
    return response;
  },
  me: () => api.get('/auth/me'),
  refreshToken: () => api.post('/auth/refresh-token'),
};

// --- API des utilisateurs ---
export const userAPI = {
  getProfile: (userId) => api.get(`/users/${userId}`),
  updateProfile: (userData) => api.put("/users/profile", userData),
  getUserVideos: (userId, params = {}) => api.get(`/users/${userId}/videos`, { params }),
  getUserStats: (userId) => api.get(`/users/${userId}/stats`),
  searchUsers: (params = {}) => api.get('/users/search', { params }),
};

// --- API des événements ---
export const eventAPI = {
  getEvents: (params = {}) => api.get("/events", { params }),
  getEventById: (eventId) => api.get(`/events/${eventId}`),
  createEvent: (eventData) => api.post("/events", eventData),
  updateEvent: (eventId, eventData) => api.put(`/events/${eventId}`, eventData),
  deleteEvent: (eventId) => api.delete(`/events/${eventId}`),
  getEventVideos: (eventId, params = {}) => api.get(`/events/${eventId}/videos`, { params }),
  joinEvent: (eventId, data = {}) => api.post(`/events/${eventId}/join`, data),
};

// --- API des vidéos ---
export const videoAPI = {
  getVideos: (params = {}) => api.get("/videos", { params }),
  getVideoById: (videoId) => api.get(`/videos/${videoId}`),
  uploadVideo: (formData) => api.post("/videos/upload", formData, {
    headers: {
      'Content-Type': 'multipart/form-data', 
    },
    timeout: 300000, // Timeout étendu à 5 minutes pour l'upload de fichiers volumineux
  }),
  updateVideo: (videoId, videoData) => api.put(`/videos/${videoId}`, videoData),
  deleteVideo: (videoId) => api.delete(`/videos/${videoId}`),
  toggleLike: (videoId, action) => api.post(`/videos/${videoId}/like`, { action }),
};

// --- API de l'IA ---
export const aiAPI = {
  searchVideos: (keywords, page = 1, limit = 12) => api.get(`/ai/search?keywords=${encodeURIComponent(keywords)}&page=${page}&limit=${limit}`),
  analyzeVideo: (videoId) => api.post(`/ia/videos/${videoId}/analyser`),
  getVideoAnalysisResults: (videoId) => api.get(`/ia/videos/${videoId}/resultats`),
};

// --- Utilitaires API ---
export const apiUtils = {
  handleError: (error) => {
    if (error.response) {
      return {
        message: error.response.data?.message || 'Erreur serveur',
        status: error.response.status,
        errors: error.response.data?.errors || [],
      };
    } else if (error.request) {
      return {
        message: 'Erreur de connexion au serveur',
        status: 0,
        errors: [],
      };
    } else {
      return {
        message: error.message || 'Erreur inconnue',
        status: 0,
        errors: [],
      };
    }
  },

  formatPaginationParams: (page = 1, limit = 10, filters = {}) => {
    return {
      page,
      limit,
      ...filters,
    };
  },

  validateVideoFile: (file) => {
    const allowedTypes = process.env.NEXT_PUBLIC_ALLOWED_VIDEO_TYPES?.split(',') || [
      'video/mp4',
      'video/quicktime',
      'video/x-quicktime',
      'video/avi',
      'video/wmv',
      'video/webm',
      'video/3gpp',
      'video/3gpp2'
    ];
    
    const maxSize = parseInt(process.env.NEXT_PUBLIC_MAX_FILE_SIZE) || 262144000; // 250MB

    if (!allowedTypes.includes(file.type)) {
      throw new Error(`Type de fichier non autorisé. Formats acceptés : ${allowedTypes.join(', ')}`);
    }

    if (file.size > maxSize) {
      throw new Error(`Fichier trop volumineux. La taille maximale est de ${apiUtils.formatFileSize(maxSize)}.`);
    }

    return true;
  },

  formatImageUrl: (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${API_URL.replace('/api', '')}${url}`;
  },

  formatDate: (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  },

  formatDateTime: (date) => {
    if (!date) return '';
    return new Date(date).toLocaleString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  },

  formatDuration: (seconds) => {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    const paddedMinutes = minutes.toString().padStart(2, '0');
    const paddedSeconds = remainingSeconds.toString().padStart(2, '0');

    if (hours > 0) {
      return `${hours}:${paddedMinutes}:${paddedSeconds}`;
    }
    
    return `${minutes}:${paddedSeconds}`;
  },

  formatFileSize: (bytes) => {
    if (isNaN(bytes) || bytes < 0) return '0 B';
    
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  },
};

export default api;


