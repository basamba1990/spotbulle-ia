'use client';

import { useState, useEffect } from 'react';
import { apiUtils } from '../../lib/api';

export default function AnalyseIAResults({ videoId, onClose }) {
  const [resultats, setResultats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (videoId) {
      chargerResultats();
    }
  }, [videoId]);

  const chargerResultats = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/ia/videos/${videoId}/resultats`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Erreur lors du chargement des résultats');
      }

      const data = await response.json();
      setResultats(data.data.video);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const lancerAnalyse = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/ia/videos/${videoId}/analyser`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Erreur lors du lancement de l\'analyse');
      }

      // Attendre un peu puis recharger les résultats
      setTimeout(() => {
        chargerResultats();
      }, 2000);
    } catch (err) {
      setError(err.message);
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

  const getStatutTexte = (statut) => {
    switch (statut) {
      case 'complete': return 'Analyse terminée';
      case 'en_cours': return 'Analyse en cours...';
      case 'en_attente': return 'En attente d\'analyse';
      case 'echec': return 'Échec de l\'analyse';
      default: return 'Statut inconnu';
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3">Chargement des résultats...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* En-tête */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Analyse IA - {resultats?.titre || 'Vidéo'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              <strong className="font-bold">Erreur:</strong>
              <span className="block sm:inline"> {error}</span>
            </div>
          )}

          {resultats ? (
            <div className="space-y-6">
              {/* Statut de l'analyse */}
              <div className="flex items-center justify-between">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatutColor(resultats.statut_analyse)}`}>
                  {getStatutTexte(resultats.statut_analyse)}
                </span>
                {resultats.date_analyse && (
                  <span className="text-sm text-gray-500">
                    Analysé le {new Date(resultats.date_analyse).toLocaleDateString('fr-FR')}
                  </span>
                )}
              </div>

              {resultats.statut_analyse === 'en_attente' && (
                <div className="text-center">
                  <button
                    onClick={lancerAnalyse}
                    className="btn btn-primary btn-md"
                  >
                    Lancer l'analyse IA
                  </button>
                </div>
              )}

              {resultats.statut_analyse === 'complete' && (
                <>
                  {/* Score de qualité */}
                  {resultats.score_qualite && (
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h3 className="font-medium text-blue-900 mb-2">Score de qualité du pitch</h3>
                      <div className="flex items-center">
                        <div className="flex-1 bg-blue-200 rounded-full h-3">
                          <div 
                            className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                            style={{ width: `${(resultats.score_qualite * 100)}%` }}
                          ></div>
                        </div>
                        <span className="ml-3 text-blue-900 font-medium">
                          {Math.round(resultats.score_qualite * 100)}%
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Transcription */}
                  {resultats.transcription && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-medium text-gray-900 mb-3">Transcription</h3>
                      <p className="text-gray-700 leading-relaxed">
                        {resultats.transcription}
                      </p>
                    </div>
                  )}

                  {/* Résumé */}
                  {resultats.resume && (
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h3 className="font-medium text-green-900 mb-3">Résumé automatique</h3>
                      <p className="text-green-800">
                        {resultats.resume}
                      </p>
                    </div>
                  )}

                  {/* Mots-clés */}
                  {resultats.mots_cles && resultats.mots_cles.length > 0 && (
                    <div>
                      <h3 className="font-medium text-gray-900 mb-3">Mots-clés extraits</h3>
                      <div className="flex flex-wrap gap-2">
                        {resultats.mots_cles.map((motCle, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm"
                          >
                            {typeof motCle === 'string' ? motCle : motCle.keyword}
                            {motCle.score && (
                              <span className="ml-1 text-purple-600">
                                ({Math.round(motCle.score * 100)}%)
                              </span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Entités nommées */}
                  {resultats.entites_nommees && resultats.entites_nommees.length > 0 && (
                    <div>
                      <h3 className="font-medium text-gray-900 mb-3">Entités identifiées</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {resultats.entites_nommees.map((entite, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-orange-50 rounded-lg"
                          >
                            <span className="text-orange-900 font-medium">
                              {entite.text}
                            </span>
                            <span className="text-orange-700 text-sm">
                              {entite.type}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {resultats.statut_analyse === 'echec' && (
                <div className="text-center">
                  <p className="text-gray-600 mb-4">
                    L'analyse IA a échoué. Vous pouvez réessayer.
                  </p>
                  <button
                    onClick={lancerAnalyse}
                    className="btn btn-primary btn-md"
                  >
                    Relancer l'analyse
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-500">
              Aucun résultat d'analyse disponible
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

