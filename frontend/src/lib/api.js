// src/lib/api.js
// Utilitaires pour les appels API

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://spotbulle-ia.onrender.com';

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
   * Vérifie si l'erreur est une erreur d'authentification (status 401)
   */
  isAuthError() {
    return this.status === 401;
  }

  /**
   * Vérifie si l'erreur est une erreur de validation (status 400 ou 422)
   */
  isValidationError() {
    return this.status === 400 || this.status === 422;
  }

  /**
   * Vérifie si l'erreur est une erreur serveur (status >= 500)
   */
  isServerError() {
    return this.status >= 500;
  }
}

// Helper pour la gestion des cookies, simulant js-cookie
// Permet de lire, définir et supprimer des cookies de manière fiable.
const cookieHelper = {
  get: (name) => {
    if (typeof document === 'undefined') return null; // S'assurer que nous sommes côté client
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for(let i=0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length); // Supprimer les espaces en début de chaîne
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  },
  set: (name, value, days) => {
    if (typeof document === 'undefined') return; // S'assurer que nous sommes côté client
    let expires = "";
    if (days) {
      const date = new Date();
      date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
      expires = "; expires=" + date.toUTCString();
    }
    // Le chemin '/' assure que le cookie est disponible sur tout le site
    document.cookie = name + "=" + (value || "")  + expires + "; path=/";
  },
  remove: (name) => {
    if (typeof document === 'undefined') return; // S'assurer que nous sommes côté client
    // Pour supprimer un cookie, on le définit avec une date d'expiration passée
    document.cookie = name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
  }
};


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
    // Construit l'URL complète de l'API
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
    };

    // Ajoute le token d'authentification (Bearer Token) si disponible
    // Utilise le cookie 'auth-token' comme le fait la version Axios avec js-cookie
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

    // Gère spécifiquement les requêtes avec FormData (pour l'upload de fichiers)
    // Le navigateur définira automatiquement le Content-Type approprié (multipart/form-data)
    if (options.body instanceof FormData) {
        delete config.headers['Content-Type']; 
    }

    try {
      const response = await fetch(url, config);
      
      // Vérifie si la réponse HTTP est dans la plage 2xx (succès)
      if (!response.ok) {
        // Tente de parser le corps de la réponse comme JSON pour obtenir les détails de l'erreur
        const errorData = await response.json().catch(() => ({}));
        const apiError = new ApiError(
          errorData.message || `Erreur HTTP ${response.status}`,
          response.status,
          errorData
        );

        // Gère la redirection pour les erreurs 401 (Non autorisé), comme dans la version Axios
        if (apiError.isAuthError() && typeof window !== 'undefined') {
          // Redirige vers la page de connexion
          window.location.href = '/login';
        }
        throw apiError; // Relance l'erreur API personnalisée
      }

      // Retourne les données JSON si le Content-Type est JSON
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        return await response.json();
      } else {
        // Gère les réponses sans contenu JSON (ex: 204 No Content) ou autre type
        return response.text(); // Ou `return {};` si vous préférez un objet vide
      }
      
    } catch (error) {
      // Si l'erreur est déjà une ApiError, la relance directement
      if (error instanceof ApiError) {
        throw error;
      }
      
      // Capture les erreurs réseau (pas de réponse du serveur) ou autres erreurs inattendues
      throw new ApiError(
        'Erreur de connexion au serveur',
        0, // Statut 0 pour les erreurs réseau
        { originalError: error.message }
      );
    }
  },

  /**
   * Récupère le token d'authentification depuis le cookie 'auth-token'.
   * Cette méthode est maintenant fiable grâce à `cookieHelper`.
   */
  getAuthToken() {
    return cookieHelper.get('auth-token');
  },

  /**
   * Définit le token d'authentification dans le cookie 'auth-token'.
   * Utile si le token est retourné dans le corps de la réponse après une connexion.
   * Par défaut, le cookie expire après 7 jours.
   */
  setAuthToken(token, days = 7) {
    cookieHelper.set('auth-token', token, days);
    // Nettoie l'ancien stockage dans localStorage si utilisé précédemment
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
  },

  /**
   * Supprime le token d'authentification du cookie 'auth-token'.
   */
  removeAuthToken() {
    cookieHelper.remove('auth-token');
    // Nettoie l'ancien stockage dans localStorage si utilisé précédemment
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
  }
};

/**
 * API d'authentification
 */
export const authAPI = {
  async login(credentials) {
    const response = await apiUtils.post('/api/auth/login', credentials);
    // Si le serveur renvoie le token dans le corps de la réponse, vous pouvez le définir ici.
    // Si le serveur définit le cookie 'auth-token' via un en-tête Set-Cookie, cette ligne n'est pas nécessaire.
    // Exemple: if (response.token) apiUtils.setAuthToken(response.token);
    return response;
  },

  async register(userData) {
    const response = await apiUtils.post('/api/auth/register', userData);
    // Similaire à login, si le token est dans le corps de la réponse.
    // Exemple: if (response.token) apiUtils.setAuthToken(response.token);
    return response;
  },

  async logout() {
    // La déconnexion côté serveur devrait invalider le token.
    // On supprime aussi le cookie côté client.
    const response = await apiUtils.post('/api/auth/logout');
    apiUtils.removeAuthToken();
    return response;
  },

  async me() {
    return apiUtils.get('/api/auth/me');
  },

  async refreshToken() {
    return apiUtils.post('/api/auth/refresh-token');
  },

  async checkAuth() {
    try {
      const response = await this.me();
      return { isAuthenticated: true, user: response.data?.user };
    } catch (error) {
      // Si l'erreur est une erreur d'authentification, cela signifie que l'utilisateur n'est pas connecté.
      if (error instanceof ApiError && error.isAuthError()) {
        apiUtils.removeAuthToken(); // S'assurer que le token invalide est supprimé
      }
      return { isAuthenticated: false, user: null };
    }
  }
};

/**
 * API des utilisateurs
 */
export const userAPI = {
  async getProfile(userId) {
    return apiUtils.get(`/api/users/${userId}`);
  },

  async updateProfile(userData) {
    return apiUtils.put('/api/users/profile', userData);
  },

  async getUserVideos(userId, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return apiUtils.get(`/api/users/${userId}/videos${queryString ? `?${queryString}` : ''}`);
  },

  async getUserStats(userId) {
    return apiUtils.get(`/api/users/${userId}/stats`);
  }
};

/**
 * API des vidéos
 */
export const videoAPI = {
  async getVideos(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return apiUtils.get(`/api/videos${queryString ? `?${queryString}` : ''}`);
  },

  async getVideoById(videoId) {
    return apiUtils.get(`/api/videos/${videoId}`);
  },

  async uploadVideo(formData) {
    // Pour l'upload de fichier, on utilise FormData.
    // Le Content-Type sera automatiquement défini par le navigateur.
    return apiUtils.request('/api/videos/upload', {
      method: 'POST',
      body: formData,
      // Pas besoin de définir 'Content-Type' ici pour FormData
    });
  },

  async updateVideo(videoId, videoData) {
    return apiUtils.put(`/api/videos/${videoId}`, videoData);
  },

  async deleteVideo(videoId) {
    return apiUtils.delete(`/api/videos/${videoId}`);
  }
};

/**
 * API des événements
 */
export const eventAPI = {
  async getEvents(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return apiUtils.get(`/api/events${queryString ? `?${queryString}` : ''}`);
  },

  async getEventById(eventId) {
    return apiUtils.get(`/api/events/${eventId}`);
  },

  async createEvent(eventData) {
    return apiUtils.post('/api/events', eventData);
  },

  async updateEvent(eventId, eventData) {
    return apiUtils.put(`/api/events/${eventId}`, eventData);
  },

  async deleteEvent(eventId) {
    return apiUtils.delete(`/api/events/${eventId}`);
  }
};

/**
 * API de l'IA
 */
export const iaAPI = {
  async getRecommendations(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return apiUtils.get(`/api/ia/recommendations${queryString ? `?${queryString}` : ''}`);
  },

  async analyzeVideo(videoId) {
    return apiUtils.post(`/api/ia/videos/${videoId}/analyser`);
  },

  async getVideoResults(videoId) {
    return apiUtils.get(`/api/ia/videos/${videoId}/resultats`);
  },

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
