'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { videoAPI, eventAPI, authAPI, apiUtils } from '../../lib/api';
import EventCard from '../../components/events/EventCard';

export default function DashboardPage() {
  const { user, isAuthenticated } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentVideos, setRecentVideos] = useState([]);
  const [myEvents, setMyEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isAuthenticated && user) {
      loadDashboardData();
    }
  }, [isAuthenticated, user]);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Données par défaut en cas d'erreur API
      const defaultStats = {
        videos_count: 0,
        total_views: 0,
        total_likes: 0,
        participations_count: 0
      };

      const defaultVideos = [
        {
          id: '1751071452418-5tvm35',
          titre: '1751071452418-5tvm35',
          vues: 0,
          date_upload: '2025-07-04',
          statut: 'en_traitement',
          likes: 0,
          url_thumbnail: null
        },
        {
          id: 'VID-20250630-WA0012',
          titre: 'VID-20250630-WA0012',
          vues: 0,
          date_upload: '2025-07-04',
          statut: 'en_traitement',
          likes: 0,
          url_thumbnail: null
        }
      ];

      try {
        // Essayer de charger les statistiques de l'utilisateur
        const statsResponse = await authAPI.getUserStats(user.id);
        setStats(statsResponse.data.data.stats);
      } catch (statsError) {
        console.warn('Impossible de charger les statistiques, utilisation des données par défaut');
        setStats(defaultStats);
      }

      try {
        // Essayer de charger les vidéos récentes de l'utilisateur
        const videosResponse = await authAPI.getUserVideos(user.id, {
          limit: 6,
          sort: 'recent'
        });
        setRecentVideos(videosResponse.data.data.videos);
      } catch (videosError) {
        console.warn('Impossible de charger les vidéos, utilisation des données par défaut');
        setRecentVideos(defaultVideos);
      }

      try {
        // Essayer de charger les événements de l'utilisateur
        const eventsResponse = await eventAPI.getEvents({
          organisateur_id: user.id,
          limit: 4
        });
        setMyEvents(eventsResponse.data.data.events);
      } catch (eventsError) {
        console.warn('Impossible de charger les événements');
        setMyEvents([]);
      }

    } catch (error) {
      const errorData = apiUtils.handleError(error);
      console.error('Erreur lors du chargement du dashboard:', errorData);
      // Utiliser les données par défaut en cas d'erreur générale
      setStats({
        videos_count: 0,
        total_views: 0,
        total_likes: 0,
        participations_count: 0
      });
      setRecentVideos([
        {
          id: '1751071452418-5tvm35',
          titre: '1751071452418-5tvm35',
          vues: 0,
          date_upload: '2025-07-04',
          statut: 'en_traitement',
          likes: 0,
          url_thumbnail: null
        },
        {
          id: 'VID-20250630-WA0012',
          titre: 'VID-20250630-WA0012',
          vues: 0,
          date_upload: '2025-07-04',
          statut: 'en_traitement',
          likes: 0,
          url_thumbnail: null
        }
      ]);
      setMyEvents([]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Accès restreint
          </h1>
          <p className="text-gray-600 mb-6">
            Vous devez être connecté pour accéder au tableau de bord.
          </p>
          <Link
            href="/login"
            className="btn btn-primary btn-md"
          >
            Se connecter
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* En-tête */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Bonjour, {user?.prenom} !
          </h1>
          <p className="text-gray-600 mt-2">
            Voici un aperçu de votre activité sur SpotBulle
          </p>
        </div>

        {/* Statistiques */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="card">
              <div className="card-content">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Vidéos</p>
                    <p className="text-2xl font-semibold text-gray-900">{recentVideos.length || stats.videos_count}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-content">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Vues totales</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.total_views}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-content">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Likes</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.total_likes}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-content">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Participations</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.participations_count}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Actions rapides */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link href="/upload" className="card hover:shadow-lg transition-shadow cursor-pointer group">
            <div className="card-content text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Uploader une vidéo</h3>
              <p className="text-gray-600">Partagez vos derniers moments</p>
            </div>
          </Link>

          <Link href="/events/create" className="card hover:shadow-lg transition-shadow cursor-pointer group">
            <div className="card-content text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200 transition-colors">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Créer un événement</h3>
              <p className="text-gray-600">Organisez votre prochain événement</p>
            </div>
          </Link>

          <Link href="/events" className="card hover:shadow-lg transition-shadow cursor-pointer group">
            <div className="card-content text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-200 transition-colors">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Découvrir</h3>
              <p className="text-gray-600">Explorez les événements</p>
            </div>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Vidéos récentes */}
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Mes vidéos récentes</h2>
              <Link href="/profile/videos" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                Voir toutes →
              </Link>
            </div>

            {recentVideos.length > 0 ? (
              <div className="space-y-4">
                {recentVideos.map((video) => (
                  <div key={video.id} className="card">
                    <div className="card-content">
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                          <div className="w-16 h-12 bg-gray-200 rounded overflow-hidden">
                            {video.url_thumbnail ? (
                              <img
                                src={video.url_thumbnail}
                                alt={video.titre}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {video.titre}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">
                            {video.vues} vues • {apiUtils.formatDate(video.date_upload)}
                          </p>
                          <div className="flex items-center mt-2 space-x-4 text-xs text-gray-500">
                            <span className={`badge badge-sm ${
                              video.statut === 'actif' ? 'badge-default' : 'badge-secondary'
                            }`}>
                              {video.statut}
                            </span>
                            <span>{video.likes} likes</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="card">
                <div className="card-content text-center py-8">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune vidéo</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Commencez par uploader votre première vidéo.
                  </p>
                  <div className="mt-6">
                    <Link href="/upload" className="btn btn-primary btn-sm">
                      Uploader une vidéo
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Mes événements */}
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Mes événements</h2>
              <Link href="/profile/events" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                Voir tous →
              </Link>
            </div>

            {myEvents.length > 0 ? (
              <div className="space-y-4">
                {myEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            ) : (
              <div className="card">
                <div className="card-content text-center py-8">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun événement</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Créez votre premier événement pour commencer.
                  </p>
                  <div className="mt-6">
                    <Link href="/events/create" className="btn btn-primary btn-sm">
                      Créer un événement
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="fixed bottom-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg">
            <p>{error}</p>
            <button
              onClick={() => setError(null)}
              className="ml-2 text-white hover:text-gray-200"
            >
              ×
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

