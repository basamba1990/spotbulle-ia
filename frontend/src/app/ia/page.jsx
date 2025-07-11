
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import RecommandationsProjets from '../../components/ia/RecommandationsProjets';
import AnalyseIAResults from '../../components/ia/AnalyseIAResults';
import { iaAPI, authAPI as userAPI, apiUtils } from '../../lib/api';

export default function IAPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('recommandations');
  const [selectedVideoId, setSelectedVideoId] = useState(null);
  const [showAnalyseModal, setShowAnalyseModal] = useState(false);
  const [isConnected, setIsConnected] = useState(true);

  // Vérifier la connectivité au chargement
  useEffect(() => {
    const checkConnection = async () => {
      const connected = await apiUtils.checkConnectivity();
      setIsConnected(connected);
    };
    
    checkConnection();
  }, []);

  const tabs = [
    {
      id: 'recommandations',
      label: 'Recommandations',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      )
    },
    {
      id: 'analyse',
      label: 'Analyse de mes vidéos',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    {
      id: 'statistiques',
      label: 'Statistiques IA',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    }
  ];

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Connexion requise
          </h1>
          <p className="text-gray-600 mb-6">
            Vous devez être connecté pour accéder aux fonctionnalités d'IA.
          </p>
          <a href="/login" className="btn btn-primary btn-md">
            Se connecter
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Alerte de connectivité */}
      {!isConnected && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Problème de connexion au serveur. Certaines fonctionnalités peuvent être indisponibles.
              </p>
            </div>
          </div>
        </div>
      )}

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
                  Découvrez des projets similaires et analysez vos pitchs avec l'IA
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  isConnected 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {isConnected ? '🤖 Fonctionnalités IA activées' : '⚠️ Connexion limitée'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation par onglets */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'recommandations' && (
          <RecommandationsProjets />
        )}

        {activeTab === 'analyse' && (
          <AnalyseMesVideos 
            onShowAnalyse={(videoId) => {
              setSelectedVideoId(videoId);
              setShowAnalyseModal(true);
            }}
          />
        )}

        {activeTab === 'statistiques' && (
          <StatistiquesIA />
        )}
      </div>

      {/* Modal d'analyse IA */}
      {showAnalyseModal && selectedVideoId && (
        <AnalyseIAResults
          videoId={selectedVideoId}
          onClose={() => {
            setShowAnalyseModal(false);
            setSelectedVideoId(null);
          }}
        />
      )}
    </div>
  );
}

// Composant pour l'analyse des vidéos de l'utilisateur
function AnalyseMesVideos({ onShowAnalyse }) {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      chargerMesVideos();
    }
  }, [user]);

  const chargerMesVideos = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiUtils.retryRequest(
        () => userAPI.getUserVideos(user.id),
        3,
        1000
      );

      setVideos(response.data.data.videos || []);
      setRetryCount(0);
    } catch (err) {
      console.error('Erreur lors du chargement des vidéos:', err);
      const errorData = apiUtils.handleError(err);
      setError(errorData.message);
      setRetryCount(prev => prev + 1);
    } finally {
      setLoading(false);
    }
  };

  const lancerAnalyseIA = async (videoId) => {
    try {
      await iaAPI.lancerAnalyse(videoId);
      
      // Mettre à jour le statut de la vidéo localement
      setVideos(prev => prev.map(video => 
        video.id === videoId 
          ? { ...video, analyse_ia_status: 'en_cours' }
          : video
      ));
      
      // Recharger les vidéos après un délai
      setTimeout(() => {
        chargerMesVideos();
      }, 2000);
      
    } catch (err) {
      console.error('Erreur lors du lancement de l\'analyse:', err);
      const errorData = apiUtils.handleError(err);
      setError(errorData.message);
    }
  };

  const getStatutColor = (statut) => {
    switch (statut) {
      case 'complete': return 'text-green-600 bg-green-100';
      case 'en_cours': return 'text-blue-600 bg-blue-100';
      case 'en_attente': return 'text-yellow-600 bg-yellow-100';
      case 'echec': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatutLabel = (statut) => {
    switch (statut) {
      case 'complete': return 'Analysé';
      case 'en_cours': return 'En cours';
      case 'en_attente': return 'En attente';
      case 'echec': return 'Échec';
      default: return 'Non analysé';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3">Chargement de vos vidéos...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <div className="flex items-center justify-between">
          <div>
            <strong className="font-bold">Erreur:</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
          <button
            onClick={chargerMesVideos}
            className="btn btn-outline btn-sm"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">
          Analyse de mes vidéos
        </h2>
        <button
          onClick={chargerMesVideos}
          className="btn btn-outline btn-sm"
        >
          Actualiser
        </button>
      </div>

      {videos.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video) => (
            <div
              key={video.id}
              className="bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-shadow"
            >
              <div className="p-6">
                <h3 className="font-semibold text-gray-900 text-lg mb-2">
                  {video.titre}
                </h3>
                
                <div className="flex items-center justify-between mb-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatutColor(video.analyse_ia_status || 'en_attente')}`}>
                    {getStatutLabel(video.analyse_ia_status)}
                  </span>
                  <span className="text-sm text-gray-500">
                    {apiUtils.formatDate(video.date_upload)}
                  </span>
                </div>

                {video.description && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {video.description}
                  </p>
                )}

                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    {video.vues || 0}
                  </span>
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    {video.likes || 0}
                  </span>
                </div>

                <div className="space-y-2">
                  {video.analyse_ia_status === 'complete' ? (
                    <button
                      onClick={() => onShowAnalyse(video.id)}
                      className="w-full btn btn-primary btn-sm"
                    >
                      Voir l'analyse IA
                    </button>
                  ) : video.analyse_ia_status === 'en_cours' ? (
                    <button
                      disabled
                      className="w-full btn btn-primary btn-sm opacity-50 cursor-not-allowed"
                    >
                      Analyse en cours...
                    </button>
                  ) : (
                    <button
                      onClick={() => lancerAnalyseIA(video.id)}
                      className="w-full btn btn-outline btn-sm"
                    >
                      Lancer l'analyse IA
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune vidéo</h3>
          <p className="mt-1 text-sm text-gray-500">
            Commencez par télécharger une vidéo pour utiliser l'analyse IA.
          </p>
          <div className="mt-6">
            <a href="/upload" className="btn btn-primary btn-md">
              Télécharger une vidéo
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

// Composant pour les statistiques IA
function StatistiquesIA() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      chargerStatistiques();
    }
  }, [user]);

  const chargerStatistiques = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiUtils.retryRequest(
        () => iaAPI.obtenirStatistiques(),
        3,
        1000
      );

      setStats(response.data.data.statistiques);
    } catch (err) {
      console.error('Erreur lors du chargement des statistiques:', err);
      const errorData = apiUtils.handleError(err);
      setError(errorData.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3">Chargement des statistiques...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <div className="flex items-center justify-between">
          <div>
            <strong className="font-bold">Erreur:</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
          <button
            onClick={chargerStatistiques}
            className="btn btn-outline btn-sm"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">
        Statistiques d'analyse IA
      </h2>

      {stats ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total vidéos</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.total || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Analyses terminées</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.complete || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-100 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">En attente</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.en_attente || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">En cours</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.en_cours || 0}</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-lg border border-gray-200 text-center">
          <p className="text-gray-500">Aucune statistique disponible</p>
        </div>
      )}
    </div>
  );
}



