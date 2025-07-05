import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://spotbulle-ia.onrender.com';

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
          // Rediriger vers la page de connexion ou afficher un message d'erreur
          // window.location.href = '/login'; // Exemple de redirection
          reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      });
    }

    return Promise.reject(error);
  }
);

// Exportez l'instance Axios et une fonction utilitaire pour les appels API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  refreshToken: (refreshToken) => api.post('/auth/refresh-token', { refreshToken }),
};

export const videoAPI = {
  uploadVideo: (formData) => {
    return api.post('/videos/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  getVideos: () => api.get('/videos'),
  getVideoById: (id) => api.get(`/videos/${id}`),
  deleteVideo: (id) => api.delete(`/videos/${id}`),
  updateVideo: (id, data) => api.put(`/videos/${id}`, data),
};

export const userAPI = {
  getUserStats: (userId) => api.get(`/users/${userId}/stats`),
  getUserVideos: (userId, params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    return api.get(`/users/${userId}/videos${queryParams ? `?${queryParams}` : ''}`);
  },
  updateProfile: (userId, data) => api.put(`/users/${userId}`, data),
};

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

export const apiUtils = {
  // Fonction pour les requêtes nécessitant une authentification
  authenticatedRequest: (method, url, data = {}) => {
    return api[method](url, data);
  },
  // Fonction pour les requêtes optionnellement authentifiées (ex: IA)
  optionalAuthRequest: (method, url, data = {}) => {
    return api[method](url, data);
  },
  // Validation des fichiers vidéo
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
    
    const maxSize = 104857600; // 100MB
    
    if (!file) {
      throw new Error('Aucun fichier sélectionné');
    }
    
    // Vérifier la taille
    if (file.size > maxSize) {
      throw new Error('Le fichier est trop volumineux. Taille maximum: 100MB');
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
  // Gestion des erreurs
  handleError: (error) => {
    if (error.response) {
      // Erreur de réponse du serveur
      return {
        message: error.response.data?.message || 'Erreur du serveur',
        status: error.response.status,
        data: error.response.data
      };
    } else if (error.request) {
      // Erreur de réseau
      return {
        message: 'Erreur de connexion au serveur',
        status: 0,
        data: null
      };
    } else {
      // Autre erreur
      return {
        message: error.message || 'Une erreur est survenue',
        status: 0,
        data: null
      };
    }
  },
  // Formater les dates
  formatDate: (dateString) => {
    if (!dateString) return '';
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
  }
};

export default api;


