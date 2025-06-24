'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function IAPageSimple() {
  const { user, isAuthenticated, isLoading, token } = useAuth();
  const [debugInfo, setDebugInfo] = useState({});

  useEffect(() => {
    // Mettre à jour les informations de débogage
    setDebugInfo({
      user: user,
      isAuthenticated: isAuthenticated,
      isLoading: isLoading,
      token: token ? 'Présent' : 'Absent',
      timestamp: new Date().toLocaleTimeString()
    });
  }, [user, isAuthenticated, isLoading, token]);

  // Affichage pendant le chargement
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h1 className="text-xl font-semibold text-gray-900">
            Chargement...
          </h1>
          <p className="text-gray-600">
            Vérification de votre authentification
          </p>
        </div>
      </div>
    );
  }

  // Affichage si non authentifié
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Connexion requise
            </h1>
            <p className="text-gray-600 mb-6">
              Vous devez être connecté pour accéder aux fonctionnalités d'IA.
            </p>
            
            {/* Informations de débogage */}
            <div className="bg-gray-100 p-4 rounded-lg mb-6 text-left">
              <h3 className="font-semibold text-sm text-gray-700 mb-2">Informations de débogage:</h3>
              <pre className="text-xs text-gray-600">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </div>
            
            <a 
              href="/login" 
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              Se connecter
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Affichage si authentifié
  return (
    <div className="min-h-screen bg-gray-50">
      {/* En-tête */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Intelligence Artificielle
                </h1>
                <p className="mt-2 text-gray-600">
                  Bienvenue {user.prenom} {user.nom} ! Les fonctionnalités IA sont maintenant accessibles.
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                  ✅ Authentifié
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Informations utilisateur */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Informations utilisateur
            </h2>
            <div className="space-y-3">
              <div>
                <span className="font-medium text-gray-700">Nom:</span>
                <span className="ml-2 text-gray-900">{user.prenom} {user.nom}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Email:</span>
                <span className="ml-2 text-gray-900">{user.email}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Rôle:</span>
                <span className="ml-2 text-gray-900">{user.role || 'Utilisateur'}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">ID:</span>
                <span className="ml-2 text-gray-900">{user.id}</span>
              </div>
            </div>
          </div>

          {/* Informations de session */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Informations de session
            </h2>
            <div className="space-y-3">
              <div>
                <span className="font-medium text-gray-700">Authentifié:</span>
                <span className="ml-2 text-green-600">✅ Oui</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Token:</span>
                <span className="ml-2 text-green-600">✅ Présent</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Dernière mise à jour:</span>
                <span className="ml-2 text-gray-900">{debugInfo.timestamp}</span>
              </div>
            </div>
          </div>

          {/* Fonctionnalités IA disponibles */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Fonctionnalités IA disponibles
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border border-gray-200 rounded-lg p-4 text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="font-medium text-gray-900 mb-2">Recommandations</h3>
                <p className="text-sm text-gray-600">Découvrez des projets similaires</p>
              </div>

              <div className="border border-gray-200 rounded-lg p-4 text-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="font-medium text-gray-900 mb-2">Analyse vidéos</h3>
                <p className="text-sm text-gray-600">Analysez vos pitchs avec l'IA</p>
              </div>

              <div className="border border-gray-200 rounded-lg p-4 text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="font-medium text-gray-900 mb-2">Statistiques</h3>
                <p className="text-sm text-gray-600">Consultez vos statistiques IA</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

