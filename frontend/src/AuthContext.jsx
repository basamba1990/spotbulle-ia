'use client';

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import Cookies from 'js-cookie';
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
        error: null,
      };

    case AUTH_ACTIONS.UPDATE_USER:
      return {
        ...state,
        user: { ...state.user, ...action.payload },
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

  // Sauvegarder le token dans les cookies
  useEffect(() => {
    if (state.token) {
      Cookies.set('auth-token', state.token, { expires: 7 });
    } else {
      Cookies.remove('auth-token');
    }
  }, [state.token]);

  // Charger l'utilisateur depuis le token
  const loadUser = async () => {
    const token = Cookies.get('auth-token');
    
    if (!token) {
      dispatch({ type: AUTH_ACTIONS.LOAD_USER_ERROR, payload: 'Aucun token trouvé' });
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
      const errorData = apiUtils.handleError(error);
      dispatch({ type: AUTH_ACTIONS.LOAD_USER_ERROR, payload: errorData.message });
      Cookies.remove('auth-token');
    }
  };

  // Connexion
  const login = async (credentials) => {
    dispatch({ type: AUTH_ACTIONS.LOGIN_START });

    try {
      const response = await authAPI.login(credentials);
      const { user, token } = response.data.data;

      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: { user, token },
      });

      return { success: true };
    } catch (error) {
      const errorData = apiUtils.handleError(error);
      dispatch({ type: AUTH_ACTIONS.LOGIN_ERROR, payload: errorData.message });
      return { success: false, error: errorData.message };
    }
  };

  // Inscription
  const register = async (userData) => {
    dispatch({ type: AUTH_ACTIONS.REGISTER_START });

    try {
      const response = await authAPI.register(userData);
      const { user, token } = response.data.data;

      dispatch({
        type: AUTH_ACTIONS.REGISTER_SUCCESS,
        payload: { user, token },
      });

      return { success: true };
    } catch (error) {
      const errorData = apiUtils.handleError(error);
      dispatch({ type: AUTH_ACTIONS.REGISTER_ERROR, payload: errorData.message });
      return { success: false, error: errorData.message };
    }
  };

  // Déconnexion
  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    } finally {
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
      Cookies.remove('auth-token');
    }
  };

  // Mettre à jour l'utilisateur
  const updateUser = (userData) => {
    dispatch({ type: AUTH_ACTIONS.UPDATE_USER, payload: userData });
  };

  // Effacer l'erreur
  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  };

  // Rafraîchir le token
  const refreshToken = async () => {
    try {
      const response = await authAPI.refreshToken();
      const { token } = response.data.data;
      
      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: { user: state.user, token },
      });

      return { success: true };
    } catch (error) {
      const errorData = apiUtils.handleError(error);
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
      return { success: false, error: errorData.message };
    }
  };

  // Vérifier si l'utilisateur est connecté
  const isLoggedIn = () => {
    return state.isAuthenticated && state.user && state.token;
  };

  // Vérifier les permissions
  const hasPermission = (permission) => {
    if (!state.user) return false;
    
    // Pour l'instant, tous les utilisateurs ont les mêmes permissions
    // Cette logique peut être étendue avec un système de rôles
    return true;
  };

  const value = {
    // État
    user: state.user,
    token: state.token,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    error: state.error,

    // Actions
    login,
    register,
    logout,
    loadUser,
    updateUser,
    clearError,
    refreshToken,

    // Utilitaires
    isLoggedIn,
    hasPermission,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;

