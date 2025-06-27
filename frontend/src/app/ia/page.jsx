'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import RecommandationsProjets from '../../components/ia/RecommandationsProjets';
import AnalyseIAResults from '../../components/ia/AnalyseIAResults';
import { videoAPI, apiUtils } from '../../lib/api'; // Chemin corrigé

export default function IAPage() {
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState('recommandations');
  const [selectedVideoId, setSelectedVideoId] = useState(null);
  const [showAnalyseModal, setShowAnalyseModal] = useState(false);

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
                <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                  🤖 Fonctionnalités IA activées
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
            token={token}
            onShowAnalyse={(videoId) => {
              setSelectedVideoId(videoId);
              setShowAnalyseModal(true);
            }}
          />
        )}

        {activeTab === 'statistiques' && (
          <StatistiquesIA token={token} />
        )}
      </div>

      {/* Modal d'analyse IA */}
      {showAnalyseModal && selectedVideoId && (
        <AnalyseIAResults
          token={token}
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
function AnalyseMesVideos({ token, onShowAnalyse }) {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (token) chargerMesVideos();
  }, [token]);

  const chargerMesVideos = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await videoAPI.getVideos({
        userId: 'me',
        include: 'analyse_ia_status'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setVideos(response.data.videos || []);
    } catch (error) {
      const apiError = apiUtils.handleError(error);
      setError(apiError.message || 'Erreur lors du chargement des vidéos');
    } finally {
      setLoading(false);
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
      <div
