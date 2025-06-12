'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { videoAPI, eventAPI, apiUtils } from '../lib/api';
import EventCard from '../components/events/EventCard';

export default function HomePage() {
  const { isAuthenticated, user } = useAuth();
  const [featuredVideos, setFeaturedVideos] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadHomeData();
  }, []);

  const loadHomeData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Charger les vidéos populaires
      const videosResponse = await videoAPI.getVideos({
        limit: 6,
        sort: 'popular'
      });

      // Charger les événements à venir
      const eventsResponse = await eventAPI.getEvents({
        limit: 4,
        date_debut: new Date().toISOString(),
        statut: 'planifie'
      });

      setFeaturedVideos(videosResponse.data.data.videos);
      setUpcomingEvents(eventsResponse.data.data.events);
    } catch (error) {
      const errorData = apiUtils.handleError(error);
      setError(errorData.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-blue-600 to-purple-700 text-white">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Partagez vos moments
              <span className="block text-yellow-300">avec SpotBulle</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
              La plateforme qui révolutionne le partage de vidéos d'événements. 
              Créez, partagez et découvrez des moments uniques avec votre communauté.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isAuthenticated ? (
                <>
                  <Link
                    href="/upload"
                    className="btn btn-primary btn-lg bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
                  >
                    Uploader une vidéo
                  </Link>
                  <Link
                    href="/events"
                    className="btn btn-outline btn-lg border-white text-white hover:bg-white hover:text-blue-600"
                  >
                    Découvrir les événements
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/register"
                    className="btn btn-primary btn-lg bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
                  >
                    Rejoindre SpotBulle
                  </Link>
                  <Link
                    href="/login"
                    className="btn btn-outline btn-lg border-white text-white hover:bg-white hover:text-blue-600"
                  >
                    Se connecter
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Pourquoi choisir SpotBulle ?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Une plateforme complète pour tous vos besoins de partage vidéo
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Upload facile
              </h3>
              <p className="text-gray-600">
                Téléchargez vos vidéos en quelques clics avec notre interface intuitive
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Communauté active
              </h3>
              <p className="text-gray-600">
                Connectez-vous avec d'autres passionnés et partagez vos expériences
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Gestion d'événements
              </h3>
              <p className="text-gray-600">
                Organisez et participez à des événements avec un système complet
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Videos Section */}
      {featuredVideos.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900">
                Vidéos populaires
              </h2>
              <Link
                href="/videos"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Voir toutes les vidéos →
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredVideos.map((video) => (
                <div key={video.id} className="card hover:shadow-lg transition-shadow">
                  <div className="video-container">
                    <video
                      src={video.url_video}
                      poster={video.url_thumbnail}
                      controls
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="card-content">
                    <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                      {video.titre}
                    </h3>
                    <p className="text-gray-600 text-sm mb-2">
                      Par {video.user?.prenom} {video.user?.nom}
                    </p>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>{video.vues} vues</span>
                      <span>{apiUtils.formatDate(video.date_upload)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Upcoming Events Section */}
      {upcomingEvents.length > 0 && (
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900">
                Événements à venir
              </h2>
              <Link
                href="/events"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Voir tous les événements →
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {upcomingEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      {!isAuthenticated && (
        <section className="py-16 bg-blue-600">
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-white mb-4">
              Prêt à commencer votre aventure ?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Rejoignez des milliers d'utilisateurs qui partagent déjà leurs moments sur SpotBulle
            </p>
            <Link
              href="/register"
              className="btn btn-primary btn-lg bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
            >
              Créer mon compte gratuitement
            </Link>
          </div>
        </section>
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
  );
}

