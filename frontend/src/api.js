import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Instance Axios configurée
const api = axios.create({
  baseURL: `${API_URL}/api`,
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
    if (error.response?.status === 401) {
      // Token expiré ou invalide
      Cookies.remove('auth-token');
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// API d'authentification
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  refreshToken: () => api.post('/auth/refresh-token'),
};

// API des utilisateurs
export const userAPI = {
  getProfile: (userId) => api.get(`/users/${userId}`),
  updateProfile: (userData) => api.put('/users/profile', userData),
  getUserVideos: (userId, params = {}) => api.get(`/users/${userId}/videos`, { params }),
  getUserStats: (userId) => api.get(`/users/${userId}/stats`),
  searchUsers: (params = {}) => api.get('/users/search', { params }),
};

// API des événements
export const eventAPI = {
  getEvents: (params = {}) => api.get('/events', { params }),
  getEventById: (eventId) => api.get(`/events/${eventId}`),
  createEvent: (eventData) => api.post('/events', eventData),
  updateEvent: (eventId, eventData) => api.put(`/events/${eventId}`, eventData),
  deleteEvent: (eventId) => api.delete(`/events/${eventId}`),
  getEventVideos: (eventId, params = {}) => api.get(`/events/${eventId}/videos`, { params }),
  joinEvent: (eventId, data = {}) => api.post(`/events/${eventId}/join`, data),
};

// API des vidéos
export const videoAPI = {
  getVideos: (params = {}) => api.get('/videos', { params }),
  getVideoById: (videoId) => api.get(`/videos/${videoId}`),
  uploadVideo: (formData) => api.post('/videos/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    timeout: 300000, // 5 minutes pour l'upload
  }),
  updateVideo: (videoId, videoData) => api.put(`/videos/${videoId}`, videoData),
  deleteVideo: (videoId) => api.delete(`/videos/${videoId}`),
  toggleLike: (videoId, action) => api.post(`/videos/${videoId}/like`, { action }),
};

// Utilitaires
export const apiUtils = {
  // Gestion des erreurs
  handleError: (error) => {
    if (error.response) {
      // Erreur de réponse du serveur
      return {
        message: error.response.data?.message || 'Erreur serveur',
        status: error.response.status,
        errors: error.response.data?.errors || [],
      };
    } else if (error.request) {
      // Erreur de réseau
      return {
        message: 'Erreur de connexion au serveur',
        status: 0,
        errors: [],
      };
    } else {
      // Autre erreur
      return {
        message: error.message || 'Erreur inconnue',
        status: 0,
        errors: [],
      };
    }
  },

  // Formatage des paramètres de pagination
  formatPaginationParams: (page = 1, limit = 10, filters = {}) => {
    return {
      page,
      limit,
      ...filters,
    };
  },

  // Validation des types de fichiers
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

  // Formatage des URLs d'images
  formatImageUrl: (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${API_URL}${url}`;
  },

  // Formatage des dates
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

  // Formatage de la durée des vidéos
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

  // Formatage de la taille des fichiers
  formatFileSize: (bytes) => {
    if (!bytes) return '0 B';
    
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  },
};

export default api;

