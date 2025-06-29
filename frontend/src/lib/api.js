// src/lib/api.js
import axios from 'axios';
import Cookies from 'js-cookie';

// Définition de l'URL de base de l'API
// Utilise la variable d'environnement NEXT_PUBLIC_API_URL,
// ou un fallback si elle n'est pas définie.
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://spotbulle-ia.onrender.com/api';

// Instance Axios configurée avec l'URL de base et un timeout
const api = axios.create({
  baseURL: API_URL,
  timeout: 30000, // Timeout de 30 secondes pour les requêtes générales
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur de requêtes : Ajoute le token d'authentification à chaque requête
api.interceptors.request.use(
  (config) => {
    // Récupère le token 'auth-token' depuis les cookies
    const token = Cookies.get('auth-token');
    if (token) {
      // Si un token existe, l'ajoute à l'en-tête Authorization au format Bearer
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config; // Retourne la configuration modifiée de la requête
  },
  (error) => {
    // Gère les erreurs lors de la configuration de la requête
    return Promise.reject(error);
  }
);

// Intercepteur de réponses : Gère les réponses et les erreurs HTTP de manière centralisée
api.interceptors.response.use(
  (response) => {
    // Si la réponse est un succès (code 2xx), la retourne directement
    return response;
  },
  (error) => {
    // Si une erreur de réponse HTTP se produit
    if (error.response) {
      const { status, data } = error.response;
      let errorMessage = data.message || `Erreur ${status} du serveur`;

      // Logique de gestion des erreurs basée sur le code de statut HTTP
      switch (status) {
        case 400:
          errorMessage = data.message || "Requête invalide.";
          break;
        case 401:
          errorMessage = data.message || "Session expirée ou non autorisée.";
          // Redirige vers la page de connexion en cas d'erreur 401
          // Assurez-vous que cette logique est exécutée côté client (navigateur)
          if (typeof window !== 'undefined') {
            // Supprime le token invalide pour éviter des boucles de redirection
            Cookies.remove('auth-token'); 
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
      // Rejette la promesse avec l'erreur de réponse pour que le code appelant puisse la gérer
      return Promise.reject(error.response); 
    } else if (error.request) {
      // L'erreur est une absence de réponse du serveur (ex: réseau coupé)
      console.error("Erreur réseau: Aucune réponse reçue.", error.message);
      return Promise.reject(new Error("Erreur de connexion au serveur. Veuillez vérifier votre connexion internet."));
    } else {
      // L'erreur est due à la configuration de la requête elle-même
      console.error("Erreur de configuration de la requête:", error.message);
      return Promise.reject(new Error("Erreur lors de la préparation de la requête."));
    }
  }
);

// --- API d'authentification ---
export const authAPI = {
  register: (userData) => api.post("/auth/register", userData),
  login: (credentials) => api.post("/auth/login", credentials),
  logout: () => api.post('/auth/logout'),
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
      // Axios gère automatiquement le Content-Type pour FormData,
      // mais le spécifier explicitement peut être utile pour la clarté.
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
};

// --- Utilitaires API ---
export const apiUtils = {
  // Fonction utilitaire pour gérer les erreurs renvoyées par les intercepteurs
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
        status: 0, // Statut 0 pour les erreurs réseau
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

  // Formatage des paramètres de pagination
  formatPaginationParams: (page = 1, limit = 10, filters = {}) => {
    return {
      page,
      limit,
      ...filters,
    };
  },

  // Validation des fichiers vidéo avant upload
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
    
    // Mise à jour de la taille maximale à 250 Mo (250 * 1024 * 1024 octets)
    const maxSize = parseInt(process.env.NEXT_PUBLIC_MAX_FILE_SIZE) || 262144000; // 250MB

    if (!allowedTypes.includes(file.type)) {
      throw new Error(`Type de fichier non autorisé. Formats acceptés : ${allowedTypes.join(', ')}`);
    }

    if (file.size > maxSize) {
      throw new Error(`Fichier trop volumineux. La taille maximale est de ${apiUtils.formatFileSize(maxSize)}.`);
    }

    return true;
  },

  // Formatage des URLs d'images
  formatImageUrl: (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    // Assurez-vous que API_URL est correctement défini pour les assets
    return `${API_URL.replace('/api', '')}${url}`; // Retire '/api' de l'URL de base pour les assets
  },

  // Formatage des dates
  formatDate: (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  },

  // Formatage des dates et heures
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

  // Formatage de la durée en secondes en format HH:MM:SS ou MM:SS
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

  // Formatage de la taille des fichiers en octets
  formatFileSize: (bytes) => {
    if (isNaN(bytes) || bytes < 0) return '0 B';
    
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  },
};

// Export par défaut de l'instance Axios configurée
export default api;
