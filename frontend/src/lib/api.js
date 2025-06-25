import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://spotbulle-ia.onrender.com';

// Instance Axios configurée
const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token d'authentification
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

// Intercepteur pour gérer les réponses et erreurs
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      let errorMessage = data.message || `Erreur ${status} du serveur`;

      switch (status) {
        case 400:
          errorMessage = data.message || "Requête invalide.";
          break;
        case 401:
          errorMessage = data.message || "Session expirée ou non autorisée.";
          // Empêcher la redirection automatique pour les requêtes d'upload de vidéo
          if (error.config.url && error.config.url.includes("/api/videos/upload")) {
            return Promise.reject(error); // Propager l'erreur pour une gestion spécifique
          } else if (typeof window !== 'undefined') {
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

    } else if (error.request) {
      console.error("Erreur réseau: Aucune réponse reçue.", error.message);
    } else {
      console.error("Erreur de configuration de la requête:", error.message);
    }
    return Promise.reject(error);
  }
);

// API d'authentification
export const authAPI = {
  register: (userData) => api.post("/api/auth/register", userData),
  login: (credentials) => api.post("/api/auth/login", credentials),
  logout: () => api.post('/api/auth/logout'),
  me: () => api.get('/api/auth/me'),
  refreshToken: () => api.post('/api/auth/refresh-token'),
};

// API des utilisateurs
export const userAPI = {
  getProfile: (userId) => api.get(`/api/users/${userId}`),
  updateProfile: (userData) => api.put("/api/users/profile", userData),
  getUserVideos: (userId, params = {}) => api.get(`/api/users/${userId}/videos`, { params }),
  getUserStats: (userId) => api.get(`/api/users/${userId}/stats`),
  searchUsers: (params = {}) => api.get('/api/users/search', { params }),
};

// API des événements
export const eventAPI = {
  getEvents: (params = {}) => api.get("/api/events", { params }),
  getEventById: (eventId) => api.get(`/api/events/${eventId}`),
  createEvent: (eventData) => api.post("/api/events", eventData),
  updateEvent: (eventId, eventData) => api.put(`/api/events/${eventId}`, eventData),
  deleteEvent: (eventId) => api.delete(`/api/events/${eventId}`),
  getEventVideos: (eventId, params = {}) => api.get(`/api/events/${eventId}/videos`, { params }),
  joinEvent: (eventId, data = {}) => api.post(`/api/events/${eventId}/join`, data),
};

// API des vidéos
export const videoAPI = {
  getVideos: (params = {}) => api.get("/api/videos", { params }),
  getVideoById: (videoId) => api.get(`/api/videos/${videoId}`),
  uploadVideo: (formData) => api.post("/api/videos/upload", formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    timeout: 300000, // 5 minutes pour l'upload
  }),
  updateVideo: (videoId, videoData) => api.put(`/api/videos/${videoId}`, videoData),
  deleteVideo: (videoId) => api.delete(`/api/videos/${videoId}`),
  toggleLike: (videoId, action) => api.post(`/api/videos/${videoId}/like`, { action }),
};

// API de l'IA
export const aiAPI = {
  searchVideos: (keywords, page = 1, limit = 12) => api.get(`/api/ai/search?keywords=${encodeURIComponent(keywords)}&page=${page}&limit=${limit}`),
};

// Utilitaires
export const apiUtils = {
  // Gestion des erreurs
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
      'video/avi',
      'video/mov',
      'video/wmv',
      'video/webm'
    ];
    
    const maxSize = parseInt(process.env.NEXT_PUBLIC_MAX_FILE_SIZE) || 104857600; // 100MB

    if (!allowedTypes.includes(file.type)) {
      throw new Error('Type de fichier non autorisé');
    }

    if (file.size > maxSize) {
      throw new Error('Fichier trop volumineux');
    }

    return true;
  },

  formatImageUrl: (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${API_URL}${url}`;
  },

  formatDate: (date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  },

  formatDateTime: (date) => {
    return new Date(date).toLocaleString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  },

  formatDuration: (seconds) => {
    if (!seconds) return '0:00';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  },

  formatFileSize: (bytes) => {
    if (!bytes) return '0 B';
    
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  },
};

export default api;

