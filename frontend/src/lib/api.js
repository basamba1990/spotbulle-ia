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

export const apiUtils = {
  // Fonction pour les requêtes nécessitant une authentification
  authenticatedRequest: (method, url, data = {}) => {
    return api[method](url, data);
  },
  // Fonction pour les requêtes optionnellement authentifiées (ex: IA)
  optionalAuthRequest: (method, url, data = {}) => {
    return api[method](url, data);
  },
};

export default api;


