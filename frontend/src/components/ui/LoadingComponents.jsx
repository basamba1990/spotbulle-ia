'use client';

import React from 'react';

/**
 * Composant de loading principal avec animation fluide
 */
export const LoadingSpinner = ({ 
  size = 'md', 
  color = 'blue', 
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const colorClasses = {
    blue: 'border-blue-600',
    gray: 'border-gray-600',
    white: 'border-white',
    green: 'border-green-600',
    red: 'border-red-600'
  };

  return (
    <div 
      className={`
        ${sizeClasses[size]} 
        ${colorClasses[color]} 
        border-2 border-t-transparent 
        rounded-full animate-spin
        ${className}
      `}
      role="status"
      aria-label="Chargement en cours"
    />
  );
};

/**
 * Composant de loading avec texte personnalisable
 */
export const LoadingWithText = ({ 
  text = 'Chargement...', 
  subtext = null,
  size = 'md',
  color = 'blue' 
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-8">
      <LoadingSpinner size={size} color={color} className="mb-4" />
      <p className="text-gray-700 font-medium">{text}</p>
      {subtext && (
        <p className="text-gray-500 text-sm mt-1">{subtext}</p>
      )}
    </div>
  );
};

/**
 * Composant de loading pour les pages complètes
 */
export const PageLoading = ({ 
  title = 'SpotBulle IA', 
  message = 'Chargement de votre contenu...' 
}) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center">
      <div className="text-center">
        {/* Logo ou titre */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>
          <div className="w-24 h-1 bg-blue-600 mx-auto rounded-full"></div>
        </div>

        {/* Animation de loading */}
        <div className="mb-6">
          <LoadingSpinner size="xl" color="blue" />
        </div>

        {/* Message */}
        <p className="text-gray-600 text-lg">{message}</p>
        
        {/* Animation de points */}
        <div className="flex justify-center mt-4 space-x-1">
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    </div>
  );
};

/**
 * Composant de loading pour les cartes/sections
 */
export const CardLoading = ({ 
  lines = 3, 
  showAvatar = false,
  className = '' 
}) => {
  return (
    <div className={`animate-pulse ${className}`}>
      <div className="flex items-start space-x-4">
        {showAvatar && (
          <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
        )}
        <div className="flex-1 space-y-3">
          {Array.from({ length: lines }).map((_, index) => (
            <div 
              key={index}
              className={`h-4 bg-gray-300 rounded ${
                index === lines - 1 ? 'w-3/4' : 'w-full'
              }`}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * Composant de loading pour les listes
 */
export const ListLoading = ({ 
  items = 5, 
  showAvatar = true,
  className = '' 
}) => {
  return (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: items }).map((_, index) => (
        <CardLoading 
          key={index}
          lines={2}
          showAvatar={showAvatar}
          className="p-4 bg-white rounded-lg shadow"
        />
      ))}
    </div>
  );
};

/**
 * Composant de loading pour les vidéos
 */
export const VideoLoading = ({ className = '' }) => {
  return (
    <div className={`animate-pulse ${className}`}>
      {/* Thumbnail de la vidéo */}
      <div className="aspect-video bg-gray-300 rounded-lg mb-3"></div>
      
      {/* Titre */}
      <div className="h-4 bg-gray-300 rounded mb-2"></div>
      
      {/* Métadonnées */}
      <div className="flex items-center space-x-2">
        <div className="w-6 h-6 bg-gray-300 rounded-full"></div>
        <div className="h-3 bg-gray-300 rounded w-1/3"></div>
      </div>
      
      {/* Stats */}
      <div className="flex space-x-4 mt-2">
        <div className="h-3 bg-gray-300 rounded w-16"></div>
        <div className="h-3 bg-gray-300 rounded w-20"></div>
      </div>
    </div>
  );
};

/**
 * Composant de loading pour les grilles de vidéos
 */
export const VideoGridLoading = ({ 
  items = 6, 
  columns = 3,
  className = '' 
}) => {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
  };

  return (
    <div className={`grid ${gridCols[columns]} gap-6 ${className}`}>
      {Array.from({ length: items }).map((_, index) => (
        <VideoLoading key={index} />
      ))}
    </div>
  );
};

/**
 * Composant de loading pour les formulaires
 */
export const FormLoading = ({ fields = 4, className = '' }) => {
  return (
    <div className={`animate-pulse space-y-6 ${className}`}>
      {Array.from({ length: fields }).map((_, index) => (
        <div key={index}>
          <div className="h-4 bg-gray-300 rounded w-1/4 mb-2"></div>
          <div className="h-10 bg-gray-300 rounded"></div>
        </div>
      ))}
      <div className="h-10 bg-gray-300 rounded w-32"></div>
    </div>
  );
};

/**
 * Composant de loading pour les tableaux
 */
export const TableLoading = ({ 
  rows = 5, 
  columns = 4,
  className = '' 
}) => {
  return (
    <div className={`animate-pulse ${className}`}>
      {/* En-tête du tableau */}
      <div className="grid grid-cols-4 gap-4 mb-4">
        {Array.from({ length: columns }).map((_, index) => (
          <div key={index} className="h-4 bg-gray-300 rounded"></div>
        ))}
      </div>
      
      {/* Lignes du tableau */}
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="grid grid-cols-4 gap-4">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <div 
                key={colIndex} 
                className={`h-4 bg-gray-300 rounded ${
                  colIndex === 0 ? 'w-3/4' : 'w-full'
                }`}
              ></div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Composant de loading avec progression
 */
export const ProgressLoading = ({ 
  progress = 0, 
  text = 'Chargement...', 
  showPercentage = true 
}) => {
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-700">{text}</span>
        {showPercentage && (
          <span className="text-sm text-gray-500">{Math.round(progress)}%</span>
        )}
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        ></div>
      </div>
    </div>
  );
};

/**
 * Hook pour gérer les états de loading
 */
export const useLoading = (initialState = false) => {
  const [isLoading, setIsLoading] = React.useState(initialState);
  const [loadingText, setLoadingText] = React.useState('Chargement...');

  const startLoading = React.useCallback((text = 'Chargement...') => {
    setLoadingText(text);
    setIsLoading(true);
  }, []);

  const stopLoading = React.useCallback(() => {
    setIsLoading(false);
  }, []);

  const withLoading = React.useCallback(async (asyncFunction, text = 'Chargement...') => {
    startLoading(text);
    try {
      const result = await asyncFunction();
      return result;
    } finally {
      stopLoading();
    }
  }, [startLoading, stopLoading]);

  return {
    isLoading,
    loadingText,
    startLoading,
    stopLoading,
    withLoading
  };
};

/**
 * Composant wrapper pour afficher un loading conditionnel
 */
export const LoadingWrapper = ({ 
  isLoading, 
  children, 
  loadingComponent = null,
  text = 'Chargement...',
  type = 'spinner' // 'spinner', 'page', 'card', 'list'
}) => {
  if (!isLoading) {
    return children;
  }

  if (loadingComponent) {
    return loadingComponent;
  }

  switch (type) {
    case 'page':
      return <PageLoading message={text} />;
    case 'card':
      return <CardLoading />;
    case 'list':
      return <ListLoading />;
    default:
      return <LoadingWithText text={text} />;
  }
};

export default LoadingSpinner;

