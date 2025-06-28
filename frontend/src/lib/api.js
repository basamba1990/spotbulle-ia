// src/lib/api.js
// Utilitaires pour les appels API

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://spotbulle-ia.onrender.com';

/**
 * Utilitaire pour effectuer des requêtes API avec gestion d'erreur
 */
export const apiUtils = {
  /**
   * Effectue une requête GET
   */
  async get(endpoint, options = {}) {
    return this.request(endpoint, {
      method: 'GET',
      ...options
    });
  },

  /**
   * Effectue une requête POST
   */
  async post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      ...options
    });
  },

  /**
   * Effectue une requête PUT
   */
  async put(endpoint, data, options = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
      ...options
    });
  },

  /**
   * Effectue une requête DELETE
   */
  async delete(endpoint, options = {}) {
    return this.request(endpoint, {
      method: 'DELETE',
      ...options
    });
  },

  /**
   * Méthode générique pour les requêtes
   */
  async request(endpoint, options = {}) {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
    };

    // Ajouter le token d'authentification si disponible
    const token = this.getAuthToken();
    if (token) {
      defaultHeaders.Authorization = `Bearer ${token}`;
    }

    const config = {
      headers: {
        ...defaultHeaders,
        ...options.headers
      },
      ...options
    };

    try {
      const response = await fetch(url, config);
      
      // Vérifier si la réponse est OK
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
          errorData.message || `Erreur HTTP ${response.status}`,
          response.status,
          errorData
        );
      }

      // Retourner les données JSON
      return await response.json();
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      
      // Erreur réseau ou autre
      throw new ApiError(
        'Erreur de connexion au serveur',
        0,
        { originalError: error.message }
      );
    }
  },

  /**
   * Récupère le token d'authentification
   */
  getAuthToken() {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token') || 
             document.cookie.split('; ')
               .find(row => row.startsWith('auth-token='))
               ?.split('=')[1];
    }
    return null;
  },

  /**
   * Définit le token d'authentification
   */
  setAuthToken(token) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
    }
  },

  /**
   * Supprime le token d'authentification
   */
  removeAuthToken() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
  }
};

/**
 * Classe d'erreur API personnalisée
 */
export class ApiError extends Error {
  constructor(message, status, data = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }

  /**
   * Vérifie si l'erreur est une erreur d'authentification
   */
  isAuthError() {
    return this.status === 401;
  }

  /**
   * Vérifie si l'erreur est une erreur de validation
   */
  isValidationError() {
    return this.status === 400 || this.status === 422;
  }

  /**
   * Vérifie si l'erreur est une erreur serveur
   */
  isServerError() {
    return this.status >= 500;
  }
}

/**
 * API d'authentification - AJOUT MANQUANT
 */
export const authAPI = {
  /**
   * Connexion utilisateur
   */
  async login(credentials) {
    return apiUtils.post('/api/auth/login', credentials);
  },

  /**
   * Inscription utilisateur
   */
  async register(userData) {
    return apiUtils.post('/api/auth/register', userData);
  },

  /**
   * Déconnexion utilisateur
   */
  async logout() {
    return apiUtils.post('/api/auth/logout');
  },

  /**
   * Récupérer les informations de l'utilisateur connecté
   */
  async me() {
    return apiUtils.get('/api/auth/me');
  },

  /**
   * Rafraîchir le token d'authentification
   */
  async refreshToken() {
    return apiUtils.post('/api/auth/refresh-token');
  },

  /**
   * Vérifier si l'utilisateur est connecté
   */
  async checkAuth() {
    try {
      const response = await this.me();
      return { isAuthenticated: true, user: response.data?.user };
    } catch (error) {
      return { isAuthenticated: false, user: null };
    }
  }
};

/**
 * API des utilisateurs
 */
export const userAPI = {
  /**
   * Récupérer le profil d'un utilisateur
   */
  async getProfile(userId) {
    return apiUtils.get(`/api/users/${userId}`);
  },

  /**
   * Mettre à jour le profil utilisateur
   */
  async updateProfile(userData) {
    return apiUtils.put('/api/users/profile', userData);
  },

  /**
   * Récupérer les vidéos d'un utilisateur
   */
  async getUserVideos(userId, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return apiUtils.get(`/api/users/${userId}/videos${queryString ? `?${queryString}` : ''}`);
  },

  /**
   * Récupérer les statistiques d'un utilisateur
   */
  async getUserStats(userId) {
    return apiUtils.get(`/api/users/${userId}/stats`);
  }
};

/**
 * API des vidéos
 */
export const videoAPI = {
  /**
   * Récupérer la liste des vidéos
   */
  async getVideos(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return apiUtils.get(`/api/videos${queryString ? `?${queryString}` : ''}`);
  },

  /**
   * Récupérer une vidéo par ID
   */
  async getVideoById(videoId) {
    return apiUtils.get(`/api/videos/${videoId}`);
  },

  /**
   * Uploader une vidéo
   */
  async uploadVideo(formData) {
    // Pour l'upload de fichier, on utilise FormData sans Content-Type
    return apiUtils.request('/api/videos/upload', {
      method: 'POST',
      body: formData,
      headers: {} // Laisser le navigateur définir le Content-Type pour FormData
    });
  },

  /**
   * Mettre à jour une vidéo
   */
  async updateVideo(videoId, videoData) {
    return apiUtils.put(`/api/videos/${videoId}`, videoData);
  },

  /**
   * Supprimer une vidéo
   */
  async deleteVideo(videoId) {
    return apiUtils.delete(`/api/videos/${videoId}`);
  }
};

/**
 * API des événements
 */
export const eventAPI = {
  /**
   * Récupérer la liste des événements
   */
  async getEvents(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return apiUtils.get(`/api/events${queryString ? `?${queryString}` : ''}`);
  },

  /**
   * Récupérer un événement par ID
   */
  async getEventById(eventId) {
    return apiUtils.get(`/api/events/${eventId}`);
  },

  /**
   * Créer un nouvel événement
   */
  async createEvent(eventData) {
    return apiUtils.post('/api/events', eventData);
  },

  /**
   * Mettre à jour un événement
   */
  async updateEvent(eventId, eventData) {
    return apiUtils.put(`/api/events/${eventId}`, eventData);
  },

  /**
   * Supprimer un événement
   */
  async deleteEvent(eventId) {
    return apiUtils.delete(`/api/events/${eventId}`);
  }
};

/**
 * API de l'IA
 */
export const iaAPI = {
  /**
   * Récupérer les recommandations IA
   */
  async getRecommendations(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return apiUtils.get(`/api/ia/recommendations${queryString ? `?${queryString}` : ''}`);
  },

  /**
   * Lancer l'analyse IA d'une vidéo
   */
  async analyzeVideo(videoId) {
    return apiUtils.post(`/api/ia/videos/${videoId}/analyser`);
  },

  /**
   * Récupérer les résultats d'analyse IA d'une vidéo
   */
  async getVideoResults(videoId) {
    return apiUtils.get(`/api/ia/videos/${videoId}/resultats`);
  },

  /**
   * Récupérer les statistiques IA
   */
  async getStatistics() {
    return apiUtils.get('/api/ia/statistiques');
  }
};

/**
 * Endpoints API spécifiques
 */
export const endpoints = {
  // Authentification
  auth: {
    login: '/api/auth/login',
    register: '/api/auth/register',
    logout: '/api/auth/logout',
    me: '/api/auth/me',
    refreshToken: '/api/auth/refresh-token'
  },

  // Utilisateurs
  users: {
    profile: (id) => `/api/users/${id}`,
    stats: (id) => `/api/users/${id}/stats`,
    videos: (id) => `/api/users/${id}/videos`
  },

  // Vidéos
  videos: {
    list: '/api/videos',
    detail: (id) => `/api/videos/${id}`,
    upload: '/api/videos/upload',
    delete: (id) => `/api/videos/${id}`
  },

  // Événements
  events: {
    list: '/api/events',
    detail: (id) => `/api/events/${id}`,
    create: '/api/events',
    update: (id) => `/api/events/${id}`,
    delete: (id) => `/api/events/${id}`
  },

  // IA
  ia: {
    recommendations: '/api/ia/recommendations',
    analyzeVideo: (id) => `/api/ia/videos/${id}/analyser`,
    videoResults: (id) => `/api/ia/videos/${id}/resultats`,
    statistics: '/api/ia/statistiques'
  }
};

/**
 * Hooks et utilitaires React pour l'API
 */
export const useApi = () => {
  return {
    apiUtils,
    authAPI,
    userAPI,
    videoAPI,
    eventAPI,
    iaAPI,
    endpoints,
    ApiError
  };
};

// Export par défaut
export default apiUtils;

