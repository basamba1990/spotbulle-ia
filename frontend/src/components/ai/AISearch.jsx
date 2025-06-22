'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import EventCard from '@/components/events/EventCard';
import { aiAPI } from '@/lib/api'; // Importez aiAPI

const AISearch = () => {
  const [searchKeywords, setSearchKeywords] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const { user } = useAuth();

  const searchVideos = async (page = 1) => {
    if (!searchKeywords.trim()) return;

    setLoading(true);
    try {
      const response = await aiAPI.searchVideos(searchKeywords, page, 12); // Utilisez aiAPI

      if (response.status === 200) {
        const data = response.data; // Axios renvoie les données dans response.data
        setSearchResults(data.data.videos);
        setPagination(data.data.pagination);
        setCurrentPage(page);
      }
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    searchVideos(1);
  };

  const handlePageChange = (newPage) => {
    searchVideos(newPage);
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Recherche IA par Mots-clés
        </h1>
        <p className="text-gray-600">
          Recherchez des vidéos en utilisant les mots-clés extraits automatiquement par l'IA
        </p>
      </div>

      {/* Formulaire de recherche */}
      <form onSubmit={handleSearch} className="mb-8">
        <div className="flex gap-4">
          <div className="flex-1">
            <input
              type="text"
              value={searchKeywords}
              onChange={(e) => setSearchKeywords(e.target.value)}
              placeholder="Entrez des mots-clés séparés par des virgules (ex: innovation, technologie, startup)"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !searchKeywords.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            {loading ? 'Recherche...' : 'Rechercher'}
          </button>
        </div>
      </form>

      {/* Suggestions de mots-clés populaires */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-700 mb-3">Mots-clés populaires</h3>
        <div className="flex flex-wrap gap-2">
          {[
            'innovation', 'technologie', 'startup', 'entrepreneuriat', 'digital',
            'intelligence artificielle', 'développement durable', 'fintech',
            'e-commerce', 'marketing', 'design', 'éducation'
          ].map((keyword) => (
            <button
              key={keyword}
              onClick={() => {
                setSearchKeywords(keyword);
                setCurrentPage(1);
                searchVideos(1);
              }}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-sm transition-colors"
            >
              {keyword}
            </button>
          ))}
        </div>
      </div>

      {/* Résultats de recherche */}
      {searchResults.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-800">
              Résultats de recherche
            </h2>
            {pagination && (
              <span className="text-gray-600">
                {pagination.total} vidéo{pagination.total > 1 ? 's' : ''} trouvée{pagination.total > 1 ? 's' : ''}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {searchResults.map((video) => (
              <div key={video.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                {/* Thumbnail */}
                <div className="aspect-video bg-gray-200 relative">
                  {video.url_thumbnail ? (
                    <img
                      src={video.url_thumbnail}
                      alt={video.titre}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 6a2 2 0 012-2h6l2 2h6a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                      </svg>
                    </div>
                  )}
                  
                  {/* Score du pitch */}
                  {video.score_pitch && (
                    <div className="absolute top-2 right-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-sm">
                      Score: {Math.round(video.score_pitch)}
                    </div>
                  )}
                </div>

                {/* Contenu */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2">
                    {video.titre}
                  </h3>
                  
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {video.description}
                  </p>

                  {/* Métadonnées */}
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                    <span>Par {video.user?.prenom} {video.user?.nom}</span>
                    <span className="capitalize">{video.thematique}</span>
                  </div>

                  {/* Mots-clés IA */}
                  {video.mots_cles_ia && video.mots_cles_ia.length > 0 && (
                    <div className="mb-3">
                      <div className="flex flex-wrap gap-1">
                        {video.mots_cles_ia.slice(0, 4).map((motCle, index) => (
                          <span 
                            key={index}
                            className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs"
                          >
                            {motCle}
                          </span>
                        ))}
                        {video.mots_cles_ia.length > 4 && (
                          <span className="text-gray-500 text-xs">
                            +{video.mots_cles_ia.length - 4}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Statistiques */}
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{video.vues} vue{video.vues > 1 ? 's' : ''}</span>
                    <span>{video.likes} like{video.likes > 1 ? 's' : ''}</span>
                  </div>

                  {/* Bouton voir */}
                  <div className="mt-3">
                    <a
                      href={`/events/${video.id}`}
                      className="block w-full bg-blue-600 hover:bg-blue-700 text-white text-center py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      Voir la vidéo
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="flex justify-center items-center space-x-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Précédent
              </button>
              
              <div className="flex space-x-1">
                {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-2 rounded-lg ${
                        currentPage === page
                          ? 'bg-blue-600 text-white'
                          : 'border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === pagination.pages}
                className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Suivant
              </button>
            </div>
          )}
        </div>
      )}

      {/* Message si aucun résultat */}
      {searchResults.length === 0 && searchKeywords && !loading && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-700 mb-2">
            Aucun résultat trouvé
          </h3>
          <p className="text-gray-500">
            Essayez avec d'autres mots-clés ou vérifiez l'orthographe.
          </p>
        </div>
      )}
    </div>
  );
};

export default AISearch;

