
'use client';

import React, { createContext, useContext, useReducer, useEffect } from 'react';
// import Cookies from 'js-cookie'; // Supprimer cette ligne
import { authAPI, apiUtils } from '../lib/api';

// Types d'actions
const AUTH_ACTIONS = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_ERROR: 'LOGIN_ERROR',
  LOGOUT: 'LOGOUT',
  REGISTER_START: 'REGISTER_START',
  REGISTER_SUCCESS: 'REGISTER_SUCCESS',
  REGISTER_ERROR: 'REGISTER_ERROR',
  LOAD_USER_START: 'LOAD_USER_START',
  LOAD_USER_SUCCESS: 'LOAD_USER_SUCCESS',
  LOAD_USER_ERROR: 'LOAD_USER_ERROR',
  UPDATE_USER: 'UPDATE_USER',
  CLEAR_ERROR: 'CLEAR_ERROR',
};

// État initial
const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

// Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_START:
    case AUTH_ACTIONS.REGISTER_START:
    case AUTH_ACTIONS.LOAD_USER_START:
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case AUTH_ACTIONS.LOGIN_SUCCESS:
    case AUTH_ACTIONS.REGISTER_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };

    case AUTH_ACTIONS.LOAD_USER_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };

    case AUTH_ACTIONS.LOGIN_ERROR:
    case AUTH_ACTIONS.REGISTER_ERROR:
    case AUTH_ACTIONS.LOAD_USER_ERROR:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };

    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      };

    case AUTH_ACTIONS.UPDATE_USER:
      return {
        ...state,
        user: { ...state.user, ...action.payload },
        isLoading: false,
        error: null,
      };

    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };

    default:
      return state;
  }
};

// Contexte
const AuthContext = createContext();

// Hook pour utiliser le contexte
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return context;
};

// Provider
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Charger l'utilisateur au démarrage
  useEffect(() => {
    loadUser();
  }, []);

  // Sauvegarder le token dans localStorage
  useEffect(() => {
    if (state.token) {
      localStorage.setItem('authToken', state.token);
    } else {
      localStorage.removeItem('authToken');
    }
  }, [state.token]);

  // Charger l'utilisateur depuis le token
  const loadUser = async () => {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
      // CORRECTION: Ne pas afficher d'erreur si aucun token au chargement initial
      dispatch({ 
        type: AUTH_ACTIONS.LOAD_USER_ERROR, 
        payload: null // Pas de message d'erreur
      });
      return;
    }

    dispatch({ type: AUTH_ACTIONS.LOAD_USER_START });

    try {
      const response = await authAPI.me();
      dispatch({
        type: AUTH_ACTIONS.LOAD_USER_SUCCESS,
        payload: { user: response.data.data.user },
      });
    } catch (error) {
      console.error('Erreur lors du chargement de l\'utilisateur:', error);
      dispatch({ 
        type: AUTH_ACTIONS.LOAD_USER_ERROR, 
        payload: 'Session expirée, veuillez vous reconnecter' 
      });
      localStorage.removeItem('authToken');
    }
  };

  // Fonction de connexion CORRIGÉE
  const login = async (credentials) => {
    dispatch({ type: AUTH_ACTIONS.LOGIN_START });

    try {
      const response = await authAPI.login(credentials);
      
      // CORRECTION: Vérification de la réponse de succès
      if (response.data && response.data.success) {
        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: {
            user: response.data.data.user,
            token: response.data.data.token,
          },
        });
        return { success: true };
      } else {
        // CORRECTION: Gestion du cas où success est false
        const errorMessage = response.data?.message || 'Erreur de connexion';
        dispatch({ 
          type: AUTH_ACTIONS.LOGIN_ERROR, 
          payload: errorMessage 
        });
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      console.error('Erreur de connexion:', error);
      
      // CORRECTION: Gestion améliorée des erreurs
      let errorMessage = 'Erreur de connexion au serveur';
      
      if (error.response) {
        // Erreur de réponse du serveur
        const status = error.response.status;
        const serverMessage = error.response.data?.message;
        
        if (status === 401) {
          errorMessage = serverMessage || 'Email ou mot de passe incorrect';
        } else if (status === 403) {
          errorMessage = serverMessage || 'Compte inactif ou suspendu';
        } else if (status === 500) {
          errorMessage = 'Erreur interne du serveur. Veuillez réessayer plus tard.';
        } else if (status >= 400 && status < 500) {
          errorMessage = serverMessage || 'Données invalides';
        } else {
          errorMessage = serverMessage || 'Erreur de connexion';
        }
      } else if (error.request) {
        // Erreur de réseau
        errorMessage = 'Impossible de contacter le serveur. Vérifiez votre connexion internet.';
      } else {
        // Autre erreur
        errorMessage = error.message || 'Erreur de connexion';
      }

      dispatch({ 
        type: AUTH_ACTIONS.LOGIN_ERROR, 
        payload: errorMessage 
      });
      return { success: false, error: errorMessage };
    }
  };

  // Fonction d'inscription CORRIGÉE
  const register = async (userData) => {
    dispatch({ type: AUTH_ACTIONS.REGISTER_START });

    try {
      const response = await authAPI.register(userData);
      
      // CORRECTION: Vérification de la réponse de succès
      if (response.data && response.data.success) {
        dispatch({
          type: AUTH_ACTIONS.REGISTER_SUCCESS,
          payload: {
            user: response.data.data.user,
            token: response.data.data.token,
          },
        });
        return { success: true };
      } else {
        // CORRECTION: Gestion du cas où success est false
        const errorMessage = response.data?.message || 'Erreur d\'inscription';
        dispatch({ 
          type: AUTH_ACTIONS.REGISTER_ERROR, 
          payload: errorMessage 
        });
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      console.error('Erreur d\'inscription:', error);
      
      // CORRECTION: Gestion améliorée des erreurs d'inscription
      let errorMessage = 'Erreur lors de l\'inscription';
      
      if (error.response) {
        const status = error.response.status;
        const serverMessage = error.response.data?.message;
        const serverErrors = error.response.data?.errors;
        
        if (status === 409) {
          errorMessage = serverMessage || 'Un utilisateur avec cet email existe déjà';
        } else if (status === 400) {
          if (serverErrors && serverErrors.length > 0) {
            errorMessage = serverErrors.map(err => err.msg).join(', ');
          } else {
            errorMessage = serverMessage || 'Données invalides';
          }
        } else if (status === 500) {
          errorMessage = 'Erreur interne du serveur. Veuillez réessayer plus tard.';
        } else {
          errorMessage = serverMessage || 'Erreur lors de l\'inscription';
        }
      } else if (error.request) {
        errorMessage = 'Impossible de contacter le serveur. Vérifiez votre connexion internet.';
      } else {
        errorMessage = error.message || 'Erreur lors de l\'inscription';
      }

      dispatch({ 
        type: AUTH_ACTIONS.REGISTER_ERROR, 
        payload: errorMessage 
      });
      return { success: false, error: errorMessage };
    }
  };

  // Fonction de déconnexion
  const logout = () => {
    dispatch({ type: AUTH_ACTIONS.LOGOUT });
    localStorage.removeItem('authToken');
  };

  // Fonction pour mettre à jour l'utilisateur
  const updateUser = (userData) => {
    dispatch({ type: AUTH_ACTIONS.UPDATE_USER, payload: userData });
  };

  // Fonction pour effacer les erreurs
  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  };

  const value = {
    ...state,
    login,
    register,
    logout,
    updateUser,
    clearError,
    loadUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;



