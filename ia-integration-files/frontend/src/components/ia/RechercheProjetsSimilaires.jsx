'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function RechercheProjetsSimilaires({ videoId, onClose }) {
  const [resultats, setResultats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filtres, setFiltres] = useState({
    limit: 5,
    score_minimum: 0.5,
    thematique: '',
    inclure_utilisateur: false
  });

  const thematiquesDisponibles = [
    { value: '', label: 'Toutes les thématiques' },
    { value: 'sport', label: 'Sport' },
    { value: 'culture', label: 'Culture' },
    { value: 'education', label: 'Éducation' },
    { value: 'famille', label: 'Famille' },
    { value: 'professionnel', label: 'Professionnel' },
    { value: 'loisirs', label: 'Loisirs' },
    { value: 'voyage', label: 'Voyage' },
    { value: 'cuisine', label: 'Cuisine' },
    { value: 'technologie', label: 'Technologie' },
    { value: 'sante', label: 'Santé' },
    { value: 'autre', label: 'Autre' }
  ];

  const rechercherSimilaires = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        limit: filtres.limit.toString(),
        score_minimum: filtres.score_minimum.toString(),
        inclure_utilisateur: filtres.inclure_utilisateur.toString()
      });

      if (filtres.thematique) {
        params.append('thematique', filtres.thematique);
      }

      const response = await fetch(`/api/ia/projets/${videoId}/similaires?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la recherche de projets similaires');
      }

      const data = await response.json();
      setResultats(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 0.8) return 'text-green-600 bg-green-100';
    if (score >= 0.7) return 'text-blue-600 bg-blue-100';
    if (score >= 0.6) return 'text-yellow-600 bg-yellow-100';
    return 'text-gray-600 bg-gray-100';
  };

  const getThematiqueColor = (thematique) => {
    const colors = {
      sport: 'bg-red-100 text-red-800',
      culture: 'bg-purple-100 text-purple-800',
      education: 'bg-blue-100 text-blue-800',
      famille: 'bg-pink-100 text-pink-800',
      professionnel: 'bg-gray-100 text-gray-800',
      loisirs: 'bg-green-100 text-green-800',
      voyage: 'bg-indigo-100 text-indigo-800',
      cuisine: 'bg-orange-100 text-orange-800',
      technologie: 'bg-cyan-100 text-cyan-800',
      sante: 'bg-emerald-100 text-emerald-800',
      autre: 'bg-slate-100 text-slate-800'
    };
    return colors[thematique] || colors.autre;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* En-tête */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Projets similaires
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
          {/* Filtres de recherche */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h3 className="font-medium text-gray-900 mb-4">Paramètres de recherche</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Nombre de résultats */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de résultats
                </label>
                <select
                  value={filtres.limit}
                  onChange={(e) => setFiltres(prev => ({ ...prev, limit: parseInt(e.target.value) }))}
                  className="input"
                >
                  <option value={5}>5 projets</option>
                  <option value={10}>10 projets</option>
                  <option value={15}>15 projets</option>
                  <option value={20}>20 projets</option>
                </select>
              </div>

              {/* Score minimum */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Similarité minimum
                </label>
                <select
                  value={filtres.score_minimum}
                  onChange={(e) => setFiltres(prev => ({ ...prev, score_minimum: parseFloat(e.target.value) }))}
                  className="input"
                >
                  <option value={0.3}>30% et plus</option>
                  <option value={0.4}>40% et plus</option>
                  <option value={0.5}>50% et plus</option>
                  <option value={0.6}>60% et plus</option>
                  <option value={0.7}>70% et plus</option>
                </select>
              </div>

              {/* Thématique */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Thématique
                </label>
                <select
                  value={filtres.thematique}
                  onChange={(e) => setFiltres(prev => ({ ...prev, thematique: e.target.value }))}
                  className="input"
                >
                  {thematiquesDisponibles.map((theme) => (
                    <option key={theme.value} value={theme.value}>
                      {theme.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Inclure utilisateur */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Options
                </label>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="inclure_utilisateur"
                    checked={filtres.inclure_utilisateur}
                    onChange={(e) => setFiltres(prev => ({ ...prev, inclure_utilisateur: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="inclure_utilisateur" className="ml-2 block text-sm text-gray-900">
                    Inclure mes projets
                  </label>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <button
                onClick={rechercherSimilaires}
                disabled={loading}
                className="btn btn-primary btn-md"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Recherche en cours...
                  </>
                ) : (
                  'Rechercher des projets similaires'
                )}
              </button>
            </div>
          </div>

          {/* Messages d'erreur */}
          {error && (
            <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              <strong className="font-bold">Erreur:</strong>
              <span className="block sm:inline"> {error}</span>
            </div>
          )}

          {/* Résultats */}
          {resultats && (
            <div className="space-y-6">
              {/* Projet de référence */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">Projet de référence</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-blue-800">{resultats.video_reference.titre}</h4>
                    <p className="text-blue-700 text-sm">
                      Par {resultats.video_reference.utilisateur.prenom} {resultats.video_reference.utilisateur.nom}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getThematiqueColor(resultats.video_reference.thematique)}`}>
                    {thematiquesDisponibles.find(t => t.value === resultats.video_reference.thematique)?.label || resultats.video_reference.thematique}
                  </span>
                </div>
              </div>

              {/* Liste des projets similaires */}
              {resultats.projets_similaires && resultats.projets_similaires.length > 0 ? (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium text-gray-900">
                      Projets similaires trouvés ({resultats.total_trouve})
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {resultats.projets_similaires.map((projet) => (
                      <div
                        key={projet.id}
                        className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        {/* En-tête du projet */}
                        <div className="flex items-start justify-between mb-3">
                          <h4 className="font-semibold text-gray-900 text-base leading-tight">
                            {projet.titre}
                          </h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getScoreColor(projet.score_similarite)}`}>
                            {Math.round(projet.score_similarite * 100)}%
                          </span>
                        </div>

                        {/* Thématique */}
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mb-3 ${getThematiqueColor(projet.thematique)}`}>
                          {thematiquesDisponibles.find(t => t.value === projet.thematique)?.label || projet.thematique}
                        </span>

                        {/* Description */}
                        {projet.description && (
                          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                            {projet.description}
                          </p>
                        )}

                        {/* Résumé IA */}
                        {projet.resume && (
                          <div className="bg-green-50 p-2 rounded mb-3">
                            <p className="text-green-800 text-sm">
                              📝 {projet.resume}
                            </p>
                          </div>
                        )}

                        {/* Mots-clés */}
                        {projet.mots_cles && projet.mots_cles.length > 0 && (
                          <div className="mb-3">
                            <div className="flex flex-wrap gap-1">
                              {projet.mots_cles.slice(0, 4).map((motCle, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs"
                                >
                                  {typeof motCle === 'string' ? motCle : motCle.keyword}
                                </span>
                              ))}
                              {projet.mots_cles.length > 4 && (
                                <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                                  +{projet.mots_cles.length - 4}
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Informations sur l'utilisateur et statistiques */}
                        <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                          <span>
                            Par {projet.utilisateur.prenom} {projet.utilisateur.nom}
                          </span>
                          <div className="flex items-center space-x-3">
                            <span className="flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              {projet.vues || 0}
                            </span>
                            <span className="flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                              </svg>
                              {projet.likes || 0}
                            </span>
                          </div>
                        </div>

                        {/* Score de qualité */}
                        {projet.score_qualite && (
                          <div className="mb-3">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">Qualité du pitch</span>
                              <span className="text-gray-900 font-medium">
                                {Math.round(projet.score_qualite * 100)}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                              <div 
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${(projet.score_qualite * 100)}%` }}
                              ></div>
                            </div>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex space-x-2">
                          <Link
                            href={`/videos/${projet.id}`}
                            className="flex-1 btn btn-primary btn-sm text-center"
                          >
                            Voir le projet
                          </Link>
                          <button
                            className="btn btn-outline btn-sm"
                            title="Contacter le porteur de projet"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun projet similaire trouvé</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Essayez de réduire le score minimum de similarité ou d'élargir les critères de recherche.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

