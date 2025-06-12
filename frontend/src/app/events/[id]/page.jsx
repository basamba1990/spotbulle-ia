'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../context/AuthContext';
import { eventAPI, apiUtils } from '../../../lib/api';

export default function EventDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [event, setEvent] = useState(null);
  const [videos, setVideos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    if (id) {
      loadEventData();
    }
  }, [id]);

  const loadEventData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Charger les détails de l'événement
      const eventResponse = await eventAPI.getEventById(id);
      setEvent(eventResponse.data.data.event);

      // Charger les vidéos de l'événement
      const videosResponse = await eventAPI.getEventVideos(id);
      setVideos(videosResponse.data.data.videos);

    } catch (error) {
      const errorData = apiUtils.handleError(error);
      setError(errorData.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinEvent = async () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    try {
      setIsJoining(true);
      setError(null);

      await eventAPI.joinEvent(id);
      setSuccess('Vous avez rejoint l\'événement avec succès !');
      
      // Recharger les données pour mettre à jour les participations
      await loadEventData();

    } catch (error) {
      const errorData = apiUtils.handleError(error);
      setError(errorData.message);
    } finally {
      setIsJoining(false);
    }
  };

  const getStatusColor = (statut) => {
    const colors = {
      planifie: 'bg-blue-100 text-blue-800',
      en_cours: 'bg-green-100 text-green-800',
      termine: 'bg-gray-100 text-gray-800',
      annule: 'bg-red-100 text-red-800',
    };
    return colors[statut] || colors.planifie;
  };

  const getStatusText = (statut) => {
    const texts = {
      planifie: 'Planifié',
      en_cours: 'En cours',
      termine: 'Terminé',
      annule: 'Annulé',
    };
    return texts[statut] || 'Planifié';
  };

  const getThemeColor = (thematique) => {
    const colors = {
      sport: 'bg-red-100 text-red-800',
      culture: 'bg-purple-100 text-purple-800',
      education: 'bg-blue-100 text-blue-800',
      famille: 'bg-green-100 text-green-800',
      professionnel: 'bg-gray-100 text-gray-800',
      loisirs: 'bg-yellow-100 text-yellow-800',
      voyage: 'bg-indigo-100 text-indigo-800',
      cuisine: 'bg-orange-100 text-orange-800',
      technologie: 'bg-cyan-100 text-cyan-800',
      sante: 'bg-pink-100 text-pink-800',
      autre: 'bg-gray-100 text-gray-800',
    };
    return colors[thematique] || colors.autre;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error && !event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Événement introuvable
          </h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link href="/events" className="btn btn-primary btn-md">
            Retour aux événements
          </Link>
        </div>
      </div>
    );
  }

  const isUpcoming = new Date(event.date_debut) > new Date();
  const isToday = new Date(event.date_debut).toDateString() === new Date().toDateString();
  const isOrganizer = user && event.organisateur_id === user.id;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex mb-8" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            <li className="inline-flex items-center">
              <Link href="/" className="text-gray-700 hover:text-blue-600">
                Accueil
              </Link>
            </li>
            <li>
              <div className="flex items-center">
                <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                <Link href="/events" className="ml-1 text-gray-700 hover:text-blue-600 md:ml-2">
                  Événements
                </Link>
              </div>
            </li>
            <li>
              <div className="flex items-center">
                <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                <span className="ml-1 text-gray-500 md:ml-2">{event.nom}</span>
              </div>
            </li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contenu principal */}
          <div className="lg:col-span-2">
            {/* Image de l'événement */}
            {event.image_url && (
              <div className="relative h-64 md:h-80 rounded-lg overflow-hidden mb-6">
                <img
                  src={event.image_url}
                  alt={event.nom}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 right-4">
                  <span className={`badge ${getStatusColor(event.statut)}`}>
                    {getStatusText(event.statut)}
                  </span>
                </div>
              </div>
            )}

            {/* Informations de l'événement */}
            <div className="card mb-6">
              <div className="card-content">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                      {event.nom}
                    </h1>
                    <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
                      <span className={`badge ${getThemeColor(event.thematique)}`}>
                        {event.thematique}
                      </span>
                      {!event.image_url && (
                        <span className={`badge ${getStatusColor(event.statut)}`}>
                          {getStatusText(event.statut)}
                        </span>
                      )}
                    </div>
                  </div>
                  {isOrganizer && (
                    <div className="flex space-x-2">
                      <Link
                        href={`/events/${event.id}/edit`}
                        className="btn btn-outline btn-sm"
                      >
                        Modifier
                      </Link>
                    </div>
                  )}
                </div>

                {event.description && (
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">Description</h2>
                    <p className="text-gray-700 whitespace-pre-wrap">{event.description}</p>
                  </div>
                )}

                {/* Tags */}
                {event.tags && event.tags.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-900 mb-2">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {event.tags.map((tag, index) => (
                        <span key={index} className="badge badge-outline">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Vidéos de l'événement */}
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Vidéos de l'événement</h2>
                <p className="card-description">
                  {videos.length} vidéo{videos.length > 1 ? 's' : ''} partagée{videos.length > 1 ? 's' : ''}
                </p>
              </div>
              <div className="card-content">
                {videos.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {videos.map((video) => (
                      <Link
                        key={video.id}
                        href={`/videos/${video.id}`}
                        className="block group"
                      >
                        <div className="card hover:shadow-lg transition-shadow">
                          <div className="video-container">
                            <video
                              src={video.url_video}
                              poster={video.url_thumbnail}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="card-content">
                            <h3 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                              {video.titre}
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">
                              Par {video.participation?.user?.prenom} {video.participation?.user?.nom}
                            </p>
                            <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
                              <span>{video.vues} vues</span>
                              <span>{video.likes} likes</span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune vidéo</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Soyez le premier à partager une vidéo de cet événement.
                    </p>
                    {isAuthenticated && (
                      <div className="mt-6">
                        <Link href="/upload" className="btn btn-primary btn-sm">
                          Uploader une vidéo
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              {/* Informations pratiques */}
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Informations pratiques</h3>
                </div>
                <div className="card-content space-y-4">
                  <div className="flex items-start space-x-3">
                    <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Date</p>
                      <p className="text-sm text-gray-600">
                        {isToday ? 'Aujourd\'hui' : apiUtils.formatDate(event.date_debut)}
                        {event.date_fin && event.date_fin !== event.date_debut && (
                          <span> - {apiUtils.formatDate(event.date_fin)}</span>
                        )}
                      </p>
                    </div>
                  </div>

                  {event.lieu && (
                    <div className="flex items-start space-x-3">
                      <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Lieu</p>
                        <p className="text-sm text-gray-600">{event.lieu}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start space-x-3">
                    <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Organisateur</p>
                      <p className="text-sm text-gray-600">
                        {event.organisateur?.prenom} {event.organisateur?.nom}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Prix</p>
                      <p className="text-sm text-gray-600">
                        {event.prix > 0 ? `${event.prix}€` : 'Gratuit'}
                      </p>
                    </div>
                  </div>

                  {event.capacite_max && (
                    <div className="flex items-start space-x-3">
                      <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Participants</p>
                        <p className="text-sm text-gray-600 mb-2">
                          {event.participations?.length || 0} / {event.capacite_max}
                        </p>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{
                              width: `${Math.min(
                                ((event.participations?.length || 0) / event.capacite_max) * 100,
                                100
                              )}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              {isUpcoming && !isOrganizer && (
                <div className="card">
                  <div className="card-content">
                    <button
                      onClick={handleJoinEvent}
                      disabled={isJoining}
                      className="btn btn-primary btn-md w-full"
                    >
                      {isJoining ? 'Inscription...' : 'Participer à l\'événement'}
                    </button>
                  </div>
                </div>
              )}

              {/* Partage */}
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Partager</h3>
                </div>
                <div className="card-content">
                  <div className="flex space-x-2">
                    <button className="btn btn-outline btn-sm flex-1">
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                      Facebook
                    </button>
                    <button className="btn btn-outline btn-sm flex-1">
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                      </svg>
                      Twitter
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Messages de feedback */}
        {success && (
          <div className="fixed bottom-4 right-4 bg-green-500 text-white p-4 rounded-lg shadow-lg">
            <p>{success}</p>
            <button
              onClick={() => setSuccess(null)}
              className="ml-2 text-white hover:text-gray-200"
            >
              ×
            </button>
          </div>
        )}

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

