'use client';

import Link from 'next/link';
import { apiUtils } from '../../lib/api';

export default function EventCard({ event }) {
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

  const isUpcoming = new Date(event.date_debut) > new Date();
  const isToday = new Date(event.date_debut).toDateString() === new Date().toDateString();

  return (
    <Link href={`/events/${event.id}`}>
      <div className="card hover:shadow-lg transition-all duration-200 cursor-pointer group">
        {event.image_url && (
          <div className="relative h-48 overflow-hidden rounded-t-lg">
            <img
              src={event.image_url}
              alt={event.nom}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            />
            <div className="absolute top-2 right-2">
              <span className={`badge ${getStatusColor(event.statut)}`}>
                {getStatusText(event.statut)}
              </span>
            </div>
          </div>
        )}
        
        <div className="card-content">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-lg text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
              {event.nom}
            </h3>
            {!event.image_url && (
              <span className={`badge ${getStatusColor(event.statut)} ml-2 flex-shrink-0`}>
                {getStatusText(event.statut)}
              </span>
            )}
          </div>

          {event.description && (
            <p className="text-gray-600 text-sm mb-3 line-clamp-2">
              {event.description}
            </p>
          )}

          <div className="space-y-2 mb-4">
            <div className="flex items-center text-sm text-gray-500">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>
                {isToday ? 'Aujourd\'hui' : apiUtils.formatDate(event.date_debut)}
                {event.date_fin && event.date_fin !== event.date_debut && (
                  <span> - {apiUtils.formatDate(event.date_fin)}</span>
                )}
              </span>
            </div>

            {event.lieu && (
              <div className="flex items-center text-sm text-gray-500">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="truncate">{event.lieu}</span>
              </div>
            )}

            <div className="flex items-center text-sm text-gray-500">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>
                Par {event.organisateur?.prenom} {event.organisateur?.nom}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className={`badge ${getThemeColor(event.thematique)}`}>
              {event.thematique}
            </span>

            {event.prix > 0 ? (
              <span className="text-sm font-medium text-gray-900">
                {event.prix}€
              </span>
            ) : (
              <span className="text-sm text-green-600 font-medium">
                Gratuit
              </span>
            )}
          </div>

          {event.capacite_max && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Capacité</span>
                <span className="text-gray-700">
                  {event.participations?.length || 0} / {event.capacite_max}
                </span>
              </div>
              <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
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
          )}

          {isUpcoming && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center text-sm text-blue-600">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>
                  {Math.ceil((new Date(event.date_debut) - new Date()) / (1000 * 60 * 60 * 24))} jour(s) restant(s)
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

