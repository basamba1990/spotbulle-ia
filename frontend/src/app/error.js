'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function Error({ error, reset }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Log l'erreur pour le debugging
    if (error) {
      console.error('Erreur de page:', error);
    }
  }, [error]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        {/* Illustration d'erreur */}
        <div className="mx-auto">
          <svg
            className="mx-auto h-32 w-32 text-red-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.34 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>

        {/* Titre et message */}
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Oups ! Une erreur s'est produite
          </h1>
          <p className="text-gray-600 mb-8">
            Nous sommes désolés, quelque chose s'est mal passé. 
            Notre équipe a été notifiée et travaille à résoudre le problème.
          </p>
          
          {/* Affichage de l'erreur en mode développement */}
          {process.env.NODE_ENV === 'development' && error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6 text-left">
              <h3 className="text-sm font-medium text-red-800 mb-2">
                Détails de l'erreur (mode développement) :
              </h3>
              <pre className="text-xs text-red-700 overflow-auto">
                {error.message || 'Erreur inconnue'}
              </pre>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-4">
          {reset && (
            <button
              onClick={reset}
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
            >
              <svg
                className="mr-2 h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Réessayer
            </button>
          )}

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/"
              className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
            >
              <svg
                className="mr-2 h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              Retour à l'accueil
            </Link>
            
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
            >
              <svg
                className="mr-2 h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Recharger la page
            </button>
          </div>
        </div>

        {/* Informations de contact */}
        <div className="pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-4">
            Le problème persiste ?
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <a
              href="mailto:support@spotbulle.com"
              className="text-blue-600 hover:text-blue-500 transition-colors duration-200"
            >
              Contacter le support
            </a>
            <Link
              href="/help"
              className="text-blue-600 hover:text-blue-500 transition-colors duration-200"
            >
              Centre d'aide
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

