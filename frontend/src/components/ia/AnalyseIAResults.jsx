'use client';

import { useState, useEffect } from 'react';

export default function AnalyseIAResults({ videoId, onClose }) {
  const [resultats, setResultats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (videoId) {
      chargerResultats();
    }
  }, [videoId]);

  const getAuthToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token') || 
             document.cookie.split('; ')
               .find(row => row.startsWith('auth-token='))
               ?.split('=')[1];
    }
    return null;
  };

  const chargerResultats = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = getAuthToken();
      const headers = {
        'Content-Type': 'application/json'
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ia/videos/${videoId}/resultats`, {
        headers
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erreur ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setResultats(data.data?.video || data.video || data);
    } catch (err) {
      console.error('Erreur lors du chargement des résultats:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const lancerAnalyse = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = getAuthToken();
      const headers = {
        'Content-Type': 'application/json'
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ia/videos/${videoId}/analyser`, {
        method: 'POST',
        headers
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erreur ${response.status}: ${response.statusText}`);
      }

      // Attendre un peu puis recharger les résultats
      setTimeout(() => {
        chargerResultats();
      }, 2000);
    } catch (err) {
      console.error('Erreur lors du lancement de l\'analyse:', err);
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
              <button
                onClick={chargerResultats}
                className="mt-2 text-sm underline hover:no-underline"
              >
                Réessayer
              </button>
            </div>
          )}

          {resultats ? (
            <div className="space-y-6">
              {/* Statut de l'analyse */}
              <div className="flex items-center justify-between">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatutColor(resultats.analyse_ia_status || resultats.statut_analyse)}`}>
                  {getStatutTexte(resultats.analyse_ia_status || resultats.statut_analyse)}
                </span>
                {resultats.date_analyse && (
                  <span className="text-sm text-gray-500">
                    Analysé le {new Date(resultats.date_analyse).toLocaleDateString('fr-FR')}
                  </span>
                )}
              </div>

              {(resultats.analyse_ia_status === 'en_attente' || !resultats.analyse_ia_status) && (
                <div className="text-center">
                  <p className="text-gray-600 mb-4">
                    Cette vidéo n'a pas encore été analysée par l'IA.
                  </p>
                  <button
                    onClick={lancerAnalyse}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
                    disabled={loading}
                  >
                    {loading ? 'Lancement...' : 'Lancer l\'analyse IA'}
                  </button>
                </div>
              )}

              {resultats.analyse_ia_status === 'en_cours' && (
                <div className="text-center">
                  <div className="animate-pulse">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-blue-600 font-medium">Analyse en cours...</p>
                  <p className="text-gray-500 text-sm mt-2">
                    L'analyse peut prendre quelques minutes. Vous pouvez fermer cette fenêtre et revenir plus tard.
                  </p>
                  <button
                    onClick={chargerResultats}
                    className="mt-4 text-blue-600 hover:text-blue-700 text-sm underline"
                  >
                    Actualiser le statut
                  </button>
                </div>
              )}

              {resultats.analyse_ia_status === 'complete' && (
                <>
                  {/* Score de qualité */}
                  {resultats.analyse_ia_score && (
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h3 className="font-medium text-blue-900 mb-2">Score de qualité du pitch</h3>
                      <div className="flex items-center">
                        <div className="flex-1 bg-blue-200 rounded-full h-3">
                          <div 
                            className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(100, Math.max(0, resultats.analyse_ia_score * 100))}%` }}
                          ></div>
                        </div>
                        <span className="ml-3 text-blue-900 font-medium">
                          {Math.round(resultats.analyse_ia_score * 100)}%
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Transcription */}
                  {resultats.analyse_ia_transcription && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-medium text-gray-900 mb-3">Transcription</h3>
                      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {resultats.analyse_ia_transcription}
                      </p>
                    </div>
                  )}

                  {/* Résumé */}
                  {resultats.analyse_ia_resume && (
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h3 className="font-medium text-green-900 mb-3">Résumé automatique</h3>
                      <p className="text-green-800">
                        {resultats.analyse_ia_resume}
                      </p>
                    </div>
                  )}

                  {/* Mots-clés */}
                  {resultats.analyse_ia_mots_cles && (
                    <div>
                      <h3 className="font-medium text-gray-900 mb-3">Mots-clés extraits</h3>
                      <div className="flex flex-wrap gap-2">
                        {(Array.isArray(resultats.analyse_ia_mots_cles) 
                          ? resultats.analyse_ia_mots_cles 
                          : JSON.parse(resultats.analyse_ia_mots_cles || '[]')
                        ).map((motCle, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm"
                          >
                            {typeof motCle === 'string' ? motCle : motCle.keyword || motCle.text}
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
                  {resultats.analyse_ia_entites && (
                    <div>
                      <h3 className="font-medium text-gray-900 mb-3">Entités identifiées</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {(Array.isArray(resultats.analyse_ia_entites) 
                          ? resultats.analyse_ia_entites 
                          : JSON.parse(resultats.analyse_ia_entites || '[]')
                        ).map((entite, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-orange-50 rounded-lg"
                          >
                            <span className="text-orange-900 font-medium">
                              {entite.text || entite.entity}
                            </span>
                            <span className="text-orange-700 text-sm">
                              {entite.type || entite.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommandations */}
                  {resultats.analyse_ia_recommandations && (
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <h3 className="font-medium text-yellow-900 mb-3">Recommandations d'amélioration</h3>
                      <div className="text-yellow-800">
                        {Array.isArray(resultats.analyse_ia_recommandations) ? (
                          <ul className="list-disc list-inside space-y-1">
                            {resultats.analyse_ia_recommandations.map((rec, index) => (
                              <li key={index}>{rec}</li>
                            ))}
                          </ul>
                        ) : (
                          <p>{resultats.analyse_ia_recommandations}</p>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}

              {resultats.analyse_ia_status === 'echec' && (
                <div className="text-center">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-red-600 font-medium mb-2">Échec de l'analyse</p>
                  <p className="text-gray-600 mb-4">
                    L'analyse IA a échoué. Cela peut être dû à un problème temporaire ou à un format de vidéo non supporté.
                  </p>
                  <button
                    onClick={lancerAnalyse}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors"
                  >
                    Relancer l'analyse
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <p>Aucun résultat d'analyse disponible</p>
              <button
                onClick={chargerResultats}
                className="mt-4 text-blue-600 hover:text-blue-700 underline"
              >
                Recharger
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

