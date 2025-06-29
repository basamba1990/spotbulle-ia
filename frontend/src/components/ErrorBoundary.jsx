'use client';

import React from 'react';

/**
 * Composant ErrorBoundary amélioré pour SpotBulle IA
 * Capture et gère les erreurs JavaScript de manière élégante
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error) {
    // Met à jour le state pour afficher l'UI de fallback
    return {
      hasError: true,
      errorId: Date.now().toString(36) + Math.random().toString(36).substr(2)
    };
  }

  componentDidCatch(error, errorInfo) {
    // Log l'erreur pour le debugging
    console.error('ErrorBoundary a capturé une erreur:', error, errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Envoyer l'erreur à un service de monitoring en production
    if (process.env.NODE_ENV === 'production') {
      this.logErrorToService(error, errorInfo);
    }
  }

  logErrorToService = (error, errorInfo) => {
    // Ici vous pouvez intégrer un service comme Sentry, LogRocket, etc.
    const errorData = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: this.getUserId(), // Si disponible
      errorId: this.state.errorId
    };

    // Exemple d'envoi à un endpoint de logging
    fetch('/api/errors', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(errorData)
    }).catch(err => {
      console.error('Erreur lors de l\'envoi du log:', err);
    });
  };

  getUserId = () => {
    // Récupérer l'ID utilisateur depuis le contexte ou localStorage
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      return user.id || 'anonymous';
    } catch {
      return 'anonymous';
    }
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    });
  };

  render() {
    if (this.state.hasError) {
      // Interface d'erreur personnalisée
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
              {/* Icône d'erreur */}
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
              </div>

              {/* Titre et message */}
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Oups ! Une erreur s'est produite
                </h2>
                <p className="text-gray-600 mb-6">
                  Nous sommes désolés, quelque chose s'est mal passé. Notre équipe a été notifiée.
                </p>
              </div>

              {/* Détails de l'erreur en mode développement */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
                  <h3 className="text-sm font-medium text-red-800 mb-2">
                    Détails de l'erreur (développement uniquement):
                  </h3>
                  <div className="text-xs text-red-700 font-mono bg-red-100 p-2 rounded overflow-auto max-h-32">
                    <div className="font-bold mb-1">{this.state.error.message}</div>
                    <div className="whitespace-pre-wrap">{this.state.error.stack}</div>
                  </div>
                  {this.state.errorInfo && (
                    <div className="mt-2 text-xs text-red-700 font-mono bg-red-100 p-2 rounded overflow-auto max-h-32">
                      <div className="font-bold mb-1">Component Stack:</div>
                      <div className="whitespace-pre-wrap">{this.state.errorInfo.componentStack}</div>
                    </div>
                  )}
                </div>
              )}

              {/* ID d'erreur pour le support */}
              <div className="mb-6 p-3 bg-gray-50 border border-gray-200 rounded-md">
                <p className="text-xs text-gray-500 text-center">
                  ID d'erreur: <span className="font-mono font-medium">{this.state.errorId}</span>
                </p>
                <p className="text-xs text-gray-400 text-center mt-1">
                  Mentionnez cet ID si vous contactez le support
                </p>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <button
                  onClick={this.handleRetry}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  Réessayer
                </button>
                
                <button
                  onClick={this.handleReload}
                  className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  Recharger la page
                </button>
                
                <button
                  onClick={this.handleGoHome}
                  className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  Retour à l'accueil
                </button>
              </div>

              {/* Informations de contact */}
              <div className="mt-6 text-center">
                <p className="text-xs text-gray-500">
                  Si le problème persiste, contactez-nous à{' '}
                  <a href="mailto:support@spotbulle.com" className="text-blue-600 hover:text-blue-500">
                    support@spotbulle.com
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Rendu normal si pas d'erreur
    return this.props.children;
  }
}

/**
 * Hook pour capturer les erreurs dans les composants fonctionnels
 */
export const useErrorHandler = () => {
  const handleError = React.useCallback((error, errorInfo = {}) => {
    console.error('Erreur capturée par useErrorHandler:', error);
    
    // En production, envoyer l'erreur au service de monitoring
    if (process.env.NODE_ENV === 'production') {
      const errorData = {
        message: error.message,
        stack: error.stack,
        ...errorInfo,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      };

      fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorData)
      }).catch(err => {
        console.error('Erreur lors de l\'envoi du log:', err);
      });
    }
  }, []);

  return { handleError };
};

/**
 * Composant d'erreur simple pour les cas spécifiques
 */
export const ErrorMessage = ({ 
  title = "Une erreur s'est produite", 
  message = "Veuillez réessayer plus tard", 
  onRetry,
  showRetry = true 
}) => {
  return (
    <div className="text-center py-8">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-4">{message}</p>
      {showRetry && onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Réessayer
        </button>
      )}
    </div>
  );
};

export default ErrorBoundary;

