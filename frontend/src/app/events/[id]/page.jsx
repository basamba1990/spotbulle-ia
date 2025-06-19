'use client';

import { useState, useEffect } from 'react';

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        // Simuler des données d'événements pour le moment
        const mockEvents = [
          {
            id: 1,
            title: "Concert de Jazz",
            description: "Une soirée musicale exceptionnelle",
            date: "2025-07-15",
            location: "Paris",
            image: "/placeholder-event.jpg"
          },
          {
            id: 2,
            title: "Festival d'été",
            description: "Trois jours de musique et de divertissement",
            date: "2025-08-20",
            location: "Lyon",
            image: "/placeholder-event.jpg"
          }
        ];
        setEvents(mockEvents);
      } catch (err) {
        setError('Erreur lors du chargement des événements');
        console.error('Erreur:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des événements...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Événements
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Découvrez les événements à venir et partagez vos moments
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {events.map((event) => (
            <div key={event.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <div className="h-48 bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                <div className="text-white text-center">
                  <div className="text-6xl mb-2">🎵</div>
                  <p className="text-sm opacity-75">Image de l'événement</p>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {event.title}
                </h3>
                <p className="text-gray-600 mb-4">
                  {event.description}
                </p>
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <span>📅 {event.date}</span>
                  <span>📍 {event.location}</span>
                </div>
                <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                  Voir les détails
                </button>
              </div>
            </div>
          ))}
        </div>

        {events.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎪</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Aucun événement pour le moment
            </h3>
            <p className="text-gray-600">
              Les événements apparaîtront ici une fois qu'ils seront créés.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

