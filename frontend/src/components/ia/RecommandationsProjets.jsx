'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function RecommandationsProjets() {
  const [recommandations, setRecommandations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtres, setFiltres] = useState({
    limit: 10,
    score_minimum: 0.6,
    thematiques: []
  });

  const thematiquesDisponibles = [
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

  useEffect(() => {
    chargerRecommandations();
  }, []);

  const chargerRecommandations = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        limit: filtres.limit.toString(),
        score_minimum: filtres.score_minimum.toString()
      });

      if (filtres.thematiques.length > 0) {
        params.append('thematiques', filtres.thematiques.join(','));
      }

      const response = await api.get(`/ia/recommandations`, { params });

      if (!response.ok) {
        throw new Error('Erreur lors du chargement des recommandations');
      }

      const data = await response.json();
      setRecommandations(data.data.recommandations || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const appliquerFiltres = () => {
    chargerRecommandations();
  };

  const toggleThematique = (thematique) => {
    setFiltres(prev => ({
      ...prev,
      thematiques: prev.thematiques.includes(thematique)
        ? prev.thematiques.filter(t => t !== thematique)
        : [...prev.thematiques, thematique]
    }));
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
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">
          Projets recommandés pour vous
        </h2>
        <button
          onClick={chargerRecommandations}
          className="btn btn-outline btn-sm"
          disabled={loading}
        >
          {loading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          ) : (
            'Actualiser'
          )}
        </button>
      </div>

      {/* Filtres */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <h3 className="font-medium text-gray-900 mb-4">Filtres</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <option value={20}>20 projets</option>
              <option value={50}>50 projets</option>
            </select>
          </div>

          {/* Score minimum */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Score minimum de pertinence
            </label>
            <select
              value={filtres.score_minimum}
              onChange={(e) => setFiltres(prev => ({ ...prev, score_minimum: parseFloat(e.target.value) }))}
              className="input"
            >
              <option value={0.5}>50% et plus</option>
              <option value={0.6}>60% et plus</option>
              <option value={0.7}>70% et plus</option>
              <option value={0.8}>80% et plus</option>
            </select>
          </div>

          {/* Bouton d'application */}
          <div className="flex items-end">
            <button
              onClick={appliquerFiltres}
              className="btn btn-primary btn-md w-full"
            >
              Appliquer les filtres
            </button>
          </div>
        </div>

        {/* Thématiques */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Thématiques (optionnel)
          </label>
          <div className="flex flex-wrap gap-2">
            {thematiquesDisponibles.map((theme) => (
              <button
                key={theme.value}
                onClick={() => toggleThematique(theme.value)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  filtres.thematiques.includes(theme.value)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {theme.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong className="font-bold">Erreur:</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3">Chargement des recommandations...</span>
        </div>
      ) : recommandations.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recommandations.map((projet) => (
            <div
              key={projet.id}
              className="bg-white rounded-lg border border-gray-200 hover:shadow-lg transition-shadow"
            >
              <div className="p-6">
                {/* En-tête du projet */}
                <div className="flex items-start justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 text-lg leading-tight">
                    {projet.titre}
                  </h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getScoreColor(projet.score_pertinence)}`}>
                    {Math.round(projet.score_pertinence * 100)}%
                  </span>
                </div>

                {/* Thématique */}
                <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mb-3 ${getThematiqueColor(projet.thematique)}`}>
                  {thematiquesDisponibles.find(t => t.value === projet.thematique)?.label || projet.thematique}
                </span>

                {/* Description/Résumé */}
                {projet.resume && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {projet.resume}
                  </p>
                )}

                {/* Mots-clés */}
                {projet.mots_cles && projet.mots_cles.length > 0 && (
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-1">
                      {projet.mots_cles.slice(0, 3).map((motCle, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs"
                        >
                          {typeof motCle === 'string' ? motCle : motCle.keyword}
                        </span>
                      ))}
                      {projet.mots_cles.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                          +{projet.mots_cles.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Informations sur l'utilisateur */}
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
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

                {/* Raison de la recommandation */}
                {projet.raison_recommandation && (
                  <div className="bg-blue-50 p-3 rounded-lg mb-4">
                    <p className="text-blue-800 text-sm">
                      💡 {projet.raison_recommandation}
                    </p>
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
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune recommandation</h3>
          <p className="mt-1 text-sm text-gray-500">
            Nous n'avons trouvé aucun projet correspondant à vos critères.
          </p>
          <div className="mt-6">
            <button
              onClick={() => {
                setFiltres(prev => ({ ...prev, score_minimum: 0.5, thematiques: [] }));
                setTimeout(chargerRecommandations, 100);
              }}
              className="btn btn-primary btn-md"
            >
              Élargir la recherche
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

