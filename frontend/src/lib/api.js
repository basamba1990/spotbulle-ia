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
 * Endpoints API spécifiques
 */
export const endpoints = {
  // Authentification
  auth: {
    login: '/api/auth/login',
    register: '/api/auth/register',
    logout: '/api/auth/logout',
    profile: '/api/auth/profile'
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
    endpoints,
    ApiError
  };
};

export default apiUtils;

