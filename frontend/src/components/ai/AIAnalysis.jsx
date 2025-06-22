'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

const AIAnalysis = ({ videoId, onAnalysisComplete }) => {
  const [analysisStatus, setAnalysisStatus] = useState('en_attente');
  const [analysisResults, setAnalysisResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [similarProjects, setSimilarProjects] = useState([]);
  const { user } = useAuth();

  // Vérifier le statut de l'analyse au chargement
  useEffect(() => {
    if (videoId) {
      checkAnalysisStatus();
    }
  }, [videoId]);

  // Polling pour vérifier le statut pendant l'analyse
  useEffect(() => {
    let interval;
    if (analysisStatus === 'en_cours') {
      interval = setInterval(() => {
        checkAnalysisStatus();
      }, 5000); // Vérifier toutes les 5 secondes
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [analysisStatus]);

  const checkAnalysisStatus = async () => {
    try {
      const response = await fetch(`/api/ai/status/${videoId}`, {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAnalysisStatus(data.data.statut_analyse_ia);
        
        if (data.data.resultats) {
          setAnalysisResults(data.data.resultats);
          if (onAnalysisComplete) {
            onAnalysisComplete(data.data.resultats);
          }
        }

        // Charger les projets similaires si l'analyse est terminée
        if (data.data.statut_analyse_ia === 'termine') {
          loadSimilarProjects();
        }
      }
    } catch (err) {
      console.error('Erreur lors de la vérification du statut:', err);
    }
  };

  const loadSimilarProjects = async () => {
    try {
      const response = await fetch(`/api/ai/similar/${videoId}`, {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSimilarProjects(data.data.projets_similaires || []);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des projets similaires:', err);
    }
  };

  const startAnalysis = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/ai/analyze/${videoId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok) {
        setAnalysisStatus('en_cours');
      } else {
        setError(data.message || 'Erreur lors du démarrage de l\'analyse');
      }
    } catch (err) {
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'en_attente': return 'text-gray-500';
      case 'en_cours': return 'text-blue-500';
      case 'termine': return 'text-green-500';
      case 'erreur': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'en_attente': return 'En attente';
      case 'en_cours': return 'Analyse en cours...';
      case 'termine': return 'Analyse terminée';
      case 'erreur': return 'Erreur lors de l\'analyse';
      default: return 'Statut inconnu';
    }
  };

  const renderSentimentBar = (sentiment) => {
    if (!sentiment) return null;

    const { positif = 0, negatif = 0, neutre = 0 } = sentiment;
    const total = positif + negatif + neutre;

    if (total === 0) return null;

    return (
      <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
        <div className="h-4 rounded-full flex">
          <div 
            className="bg-green-500 h-full rounded-l-full"
            style={{ width: `${(positif / total) * 100}%` }}
          ></div>
          <div 
            className="bg-gray-400 h-full"
            style={{ width: `${(neutre / total) * 100}%` }}
          ></div>
          <div 
            className="bg-red-500 h-full rounded-r-full"
            style={{ width: `${(negatif / total) * 100}%` }}
          ></div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-gray-800">
          Analyse IA du Pitch
        </h3>
        <span className={`font-medium ${getStatusColor(analysisStatus)}`}>
          {getStatusText(analysisStatus)}
        </span>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {analysisStatus === 'en_attente' && (
        <div className="text-center">
          <p className="text-gray-600 mb-4">
            Lancez l'analyse IA pour obtenir une transcription automatique, 
            extraire les mots-clés et trouver des projets similaires.
          </p>
          <button
            onClick={startAnalysis}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            {loading ? 'Démarrage...' : 'Lancer l\'analyse IA'}
          </button>
        </div>
      )}

      {analysisStatus === 'en_cours' && (
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            Analyse en cours... Cela peut prendre quelques minutes.
          </p>
        </div>
      )}

      {analysisStatus === 'termine' && analysisResults && (
        <div className="space-y-6">
          {/* Score du pitch */}
          {analysisResults.score_pitch !== null && (
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Score du Pitch</h4>
              <div className="flex items-center space-x-3">
                <div className="flex-1 bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 h-3 rounded-full"
                    style={{ width: `${analysisResults.score_pitch}%` }}
                  ></div>
                </div>
                <span className="font-bold text-lg">
                  {Math.round(analysisResults.score_pitch)}/100
                </span>
              </div>
            </div>
          )}

          {/* Mots-clés */}
          {analysisResults.mots_cles && analysisResults.mots_cles.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Mots-clés extraits</h4>
              <div className="flex flex-wrap gap-2">
                {analysisResults.mots_cles.map((motCle, index) => (
                  <span 
                    key={index}
                    className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium"
                  >
                    {motCle}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Analyse de sentiment */}
          {analysisResults.sentiment && (
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Analyse de sentiment</h4>
              {renderSentimentBar(analysisResults.sentiment)}
              <div className="flex justify-between text-sm text-gray-600">
                <span>Positif: {Math.round((analysisResults.sentiment.positif || 0) * 100)}%</span>
                <span>Neutre: {Math.round((analysisResults.sentiment.neutre || 0) * 100)}%</span>
                <span>Négatif: {Math.round((analysisResults.sentiment.negatif || 0) * 100)}%</span>
              </div>
            </div>
          )}

          {/* Transcription */}
          {analysisResults.transcription && (
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Transcription</h4>
              <div className="bg-gray-50 p-4 rounded-lg max-h-40 overflow-y-auto">
                <p className="text-gray-700 text-sm leading-relaxed">
                  {analysisResults.transcription}
                </p>
              </div>
            </div>
          )}

          {/* Projets similaires */}
          {similarProjects.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-700 mb-3">Projets similaires</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {similarProjects.map((projet) => (
                  <div key={projet.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <h5 className="font-medium text-gray-800 mb-1">{projet.titre}</h5>
                    <p className="text-gray-600 text-sm mb-2 line-clamp-2">{projet.description}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Par {projet.user?.prenom} {projet.user?.nom}</span>
                      <span>Score: {projet.score_pitch || 'N/A'}</span>
                    </div>
                    {projet.mots_cles_ia && projet.mots_cles_ia.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {projet.mots_cles_ia.slice(0, 3).map((motCle, index) => (
                          <span 
                            key={index}
                            className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs"
                          >
                            {motCle}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {analysisStatus === 'erreur' && (
        <div className="text-center">
          <p className="text-red-600 mb-4">
            Une erreur s'est produite lors de l'analyse. Veuillez réessayer.
          </p>
          <button
            onClick={startAnalysis}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            {loading ? 'Démarrage...' : 'Relancer l\'analyse'}
          </button>
        </div>
      )}
    </div>
  );
};

export default AIAnalysis;

