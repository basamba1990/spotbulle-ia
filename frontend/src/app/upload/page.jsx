'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import VideoUploader from '../../components/ui/VideoUploader';

export default function UploadPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadedVideo, setUploadedVideo] = useState(null);
  const [error, setError] = useState(null);

  const handleUploadSuccess = (video) => {
    setUploadedVideo(video);
    setUploadSuccess(true);
    setError(null);
  };

  const handleUploadError = (errorMessage) => {
    setError(errorMessage);
    setUploadSuccess(false);
  };

  const handleNewUpload = () => {
    setUploadSuccess(false);
    setUploadedVideo(null);
    setError(null);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Accès restreint
          </h1>
          <p className="text-gray-600 mb-6">
            Vous devez être connecté pour uploader des vidéos.
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!uploadSuccess ? (
          <>
            {/* En-tête */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Uploader une vidéo
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Partagez vos moments avec la communauté SpotBulle. 
                Téléchargez votre vidéo et ajoutez les informations nécessaires.
              </p>
            </div>

            {/* Conseils d'upload */}
            <div className="card mb-8">
              <div className="card-header">
                <h2 className="card-title text-lg">Conseils pour un upload réussi</h2>
              </div>
              <div className="card-content">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Formats supportés</h3>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• MP4 (recommandé)</li>
                      <li>• AVI, MOV, WMV</li>
                      <li>• WebM</li>
                      <li>• Taille max: 100MB</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Bonnes pratiques</h3>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Utilisez un titre descriptif</li>
                      <li>• Ajoutez des tags pertinents</li>
                      <li>• Choisissez la bonne thématique</li>
                      <li>• Rédigez une description claire</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Composant d'upload */}
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Télécharger votre vidéo</h2>
                <p className="card-description">
                  Sélectionnez votre fichier vidéo et remplissez les informations
                </p>
              </div>
              <div className="card-content">
                <VideoUploader
                  onUploadSuccess={handleUploadSuccess}
                  onUploadError={handleUploadError}
                />
              </div>
            </div>

            {/* Message d'erreur */}
            {error && (
              <div className="mt-6 bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-red-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      Erreur d'upload
                    </h3>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                  </div>
                  <div className="ml-auto pl-3">
                    <button
                      onClick={() => setError(null)}
                      className="text-red-400 hover:text-red-600"
                    >
                      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path
                          fillRule="evenodd"
                          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          /* Page de succès */
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-6">
              <svg
                className="h-6 w-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Vidéo uploadée avec succès !
            </h1>
            
            <p className="text-lg text-gray-600 mb-8">
              Votre vidéo "{uploadedVideo?.titre}" a été publiée et est maintenant visible par la communauté.
            </p>

            {uploadedVideo && (
              <div className="card max-w-md mx-auto mb-8">
                <div className="card-content">
                  <h3 className="font-semibold text-lg mb-2">{uploadedVideo.titre}</h3>
                  {uploadedVideo.description && (
                    <p className="text-gray-600 text-sm mb-3">{uploadedVideo.description}</p>
                  )}
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span className="badge badge-default">{uploadedVideo.thematique}</span>
                    <span>{uploadedVideo.statut}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href={`/videos/${uploadedVideo?.id}`}
                className="btn btn-primary btn-md"
              >
                Voir ma vidéo
              </Link>
              <button
                onClick={handleNewUpload}
                className="btn btn-outline btn-md"
              >
                Uploader une autre vidéo
              </button>
              <Link
                href="/dashboard"
                className="btn btn-ghost btn-md"
              >
                Retour au tableau de bord
              </Link>
            </div>

            {/* Suggestions */}
            <div className="mt-12 max-w-2xl mx-auto">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Et maintenant ?
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link
                  href="/events"
                  className="card hover:shadow-lg transition-shadow cursor-pointer group"
                >
                  <div className="card-content text-center">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2 group-hover:bg-blue-200 transition-colors">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h3 className="font-medium text-gray-900">Découvrir les événements</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Participez à des événements de votre communauté
                    </p>
                  </div>
                </Link>

                <Link
                  href="/events/create"
                  className="card hover:shadow-lg transition-shadow cursor-pointer group"
                >
                  <div className="card-content text-center">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2 group-hover:bg-green-200 transition-colors">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <h3 className="font-medium text-gray-900">Créer un événement</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Organisez votre propre événement
                    </p>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

