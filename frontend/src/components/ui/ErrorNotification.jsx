'use client';

import { useState, useEffect } from 'react';

export default function ErrorNotification({ 
  error, 
  onClose, 
  autoClose = true, 
  duration = 5000,
  type = 'error' 
}) {
  const [isVisible, setIsVisible] = useState(!!error);

  useEffect(() => {
    setIsVisible(!!error);
    
    if (error && autoClose) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onClose && onClose(), 300); // Délai pour l'animation
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [error, autoClose, duration, onClose]);

  if (!error || !isVisible) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'warning':
        return {
          bg: 'bg-yellow-500',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          )
        };
      case 'info':
        return {
          bg: 'bg-blue-500',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )
        };
      case 'success':
        return {
          bg: 'bg-green-500',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )
        };
      default: // error
        return {
          bg: 'bg-red-500',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )
        };
    }
  };

  const { bg, icon } = getTypeStyles();

  const getTitle = () => {
    switch (type) {
      case 'warning': return 'Attention';
      case 'info': return 'Information';
      case 'success': return 'Succès';
      default: return 'Erreur';
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose && onClose(), 300);
  };

  return (
    <div className={`fixed bottom-4 right-4 max-w-sm ${bg} text-white p-4 rounded-lg shadow-lg z-50 transform transition-all duration-300 ${
      isVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
    }`}>
      <div className="flex items-start">
        <div className="flex-shrink-0 mr-3">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{getTitle()}</p>
          <p className="text-sm opacity-90 mt-1 break-words">
            {typeof error === 'string' ? error : error?.message || 'Une erreur est survenue'}
          </p>
          
          {/* Affichage des détails techniques en mode développement */}
          {process.env.NODE_ENV === 'development' && error?.stack && (
            <details className="mt-2">
              <summary className="text-xs opacity-75 cursor-pointer hover:opacity-100">
                Détails techniques
              </summary>
              <pre className="text-xs opacity-75 mt-1 whitespace-pre-wrap break-all">
                {error.stack}
              </pre>
            </details>
          )}
        </div>
        <button
          onClick={handleClose}
          className="ml-3 flex-shrink-0 text-white hover:text-gray-200 transition-colors"
          aria-label="Fermer la notification"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      {/* Barre de progression pour l'auto-fermeture */}
      {autoClose && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black bg-opacity-20 rounded-b-lg overflow-hidden">
          <div 
            className="h-full bg-white bg-opacity-30 transition-all ease-linear"
            style={{
              width: '100%',
              animation: `shrink ${duration}ms linear forwards`
            }}
          />
        </div>
      )}
      
      <style jsx>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
}

// Composant wrapper pour une utilisation plus simple
export function useErrorNotification() {
  const [error, setError] = useState(null);
  const [type, setType] = useState('error');

  const showError = (errorMessage, errorType = 'error') => {
    setError(errorMessage);
    setType(errorType);
  };

  const clearError = () => {
    setError(null);
  };

  const ErrorComponent = () => (
    <ErrorNotification 
      error={error} 
      onClose={clearError} 
      type={type}
    />
  );

  return {
    error,
    showError,
    clearError,
    ErrorComponent
  };
}

