'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { videoAPI, apiUtils } from '../../lib/api';

export default function VideoUploader({ onUploadSuccess, onUploadError }) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadError, setUploadError] = useState(null); // Nouvel état pour les erreurs d'upload
  const [formData, setFormData] = useState({
    titre: '',
    description: '',
    thematique: 'autre',
    tags: [],
    evenement_id: '',
    parametres_confidentialite: {
      public: true,
      commentaires_autorises: true,
      telechargement_autorise: false,
    },
  });

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    if (rejectedFiles.length > 0) {
      const error = rejectedFiles[0].errors[0];
      setUploadError(error.message);
      return;
    }

    const file = acceptedFiles[0];
    if (file) {
      try {
        apiUtils.validateVideoFile(file);
        setSelectedFile(file);
        
        // Générer un titre par défaut basé sur le nom du fichier
        if (!formData.titre) {
          const fileName = file.name.replace(/\.[^/.]+$/, '');
          setFormData(prev => ({
            ...prev,
            titre: fileName,
          }));
        }
      } catch (error) {
        setUploadError(error.message);
      }
    }
  }, [formData.titre, onUploadError]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.avi', '.mov', '.wmv', '.webm'],
    },
    maxFiles: 1,
    maxSize: parseInt(process.env.NEXT_PUBLIC_MAX_FILE_SIZE) || 104857600, // 100MB
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('parametres_confidentialite.')) {
      const paramName = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        parametres_confidentialite: {
          ...prev.parametres_confidentialite,
          [paramName]: type === 'checkbox' ? checked : value,
        },
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }));
    }
  };

  const handleTagsChange = (e) => {
    const value = e.target.value;
    const tags = value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    setFormData(prev => ({
      ...prev,
      tags,
    }));
  };

  const handleUpload = async () => {
    if (!selectedFile || !formData.titre.trim()) {
      setUploadError("Veuillez sélectionner un fichier et saisir un titre");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('video', selectedFile);
      uploadFormData.append('titre', formData.titre);
      uploadFormData.append('description', formData.description);
      uploadFormData.append('thematique', formData.thematique);
      uploadFormData.append('tags', JSON.stringify(formData.tags));
      uploadFormData.append('parametres_confidentialite', JSON.stringify(formData.parametres_confidentialite));
      
      if (formData.evenement_id) {
        uploadFormData.append('evenement_id', formData.evenement_id);
      }

      // Simuler le progrès d'upload (dans un vrai projet, utiliser onUploadProgress d'axios)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + Math.random() * 10;
        });
      }, 500);

      const response = await videoAPI.uploadVideo(uploadFormData);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
        setSelectedFile(null);
        setFormData({
          titre: '',
          description: '',
          thematique: 'autre',
          tags: [],
          evenement_id: '',
          parametres_confidentialite: {
            public: true,
            commentaires_autorises: true,
            telechargement_autorise: false,
          },
        });
        
        onUploadSuccess?.(response.data.data.video);
      }, 100);
      } catch (error) {
        setIsUploading(false);
        setUploadProgress(0);
        const errorData = apiUtils.handleError(error);
        
        if (error.response && error.response.status === 401) {
          setUploadError("Votre session a expiré. Veuillez vous reconnecter pour télécharger des vidéos.");
          // Optionnel: Rediriger l'utilisateur vers la page de connexion après un court délai
          // setTimeout(() => { window.location.href = '/login'; }, 2000);
        } else {
          setUploadError(errorData.message);
        }
      }  const removeFile = () => {
    setSelectedFile(null);
    setUploadProgress(0);
  };

  const thematiques = [
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
    { value: 'autre', label: 'Autre' },
  ];

  return (
    <div className="space-y-6">
      {/* Zone de drop */}
      <div
        {...getRootProps()}
        className={`dropzone ${isDragActive ? 'active' : ''} ${isDragReject ? 'reject' : ''}`}
      >
        <input {...getInputProps()} />
        
        {selectedFile ? (
          <div className="text-center">
            <svg className="mx-auto h-12 w-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <p className="mt-2 text-sm text-gray-600">
              <span className="font-medium">{selectedFile.name}</span>
            </p>
            <p className="text-xs text-gray-500">
              {apiUtils.formatFileSize(selectedFile.size)}
            </p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeFile();
              }}
              className="mt-2 text-sm text-red-600 hover:text-red-700"
            >
              Supprimer
            </button>
          </div>
        ) : (
          <div className="text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="mt-4">
              <p className="text-sm text-gray-600">
                {isDragActive ? (
                  'Déposez votre vidéo ici...'
                ) : (
                  <>
                    <span className="font-medium text-blue-600">Cliquez pour sélectionner</span> ou glissez-déposez votre vidéo
                  </>
                )}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                MP4, AVI, MOV, WMV, WebM jusqu'à 100MB
              </p>
            </div>
          </div>
        )}
      </div>

      {uploadError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Erreur:</strong>
          <span className="block sm:inline"> {uploadError}</span>
          <span className="absolute top-0 bottom-0 right-0 px-4 py-3">
            <svg className="fill-current h-6 w-6 text-red-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" onClick={() => setUploadError(null)}><title>Close</title><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/></svg>
          </span>
        </div>
      )}

      {/* Barre de progression */}
      {isUploading && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Upload en cours...</span>
            <span className="text-gray-600">{Math.round(uploadProgress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Formulaire de métadonnées */}
      {selectedFile && !isUploading && (
        <div className="space-y-4">
          <div>
            <label htmlFor="titre" className="block text-sm font-medium text-gray-700">
              Titre de la vidéo *
            </label>
            <input
              type="text"
              id="titre"
              name="titre"
              required
              className="input mt-1"
              placeholder="Donnez un titre à votre vidéo"
              value={formData.titre}
              onChange={handleInputChange}
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              className="textarea mt-1"
              placeholder="Décrivez votre vidéo..."
              value={formData.description}
              onChange={handleInputChange}
            />
          </div>

          <div>
            <label htmlFor="thematique" className="block text-sm font-medium text-gray-700">
              Thématique
            </label>
            <select
              id="thematique"
              name="thematique"
              className="input mt-1"
              value={formData.thematique}
              onChange={handleInputChange}
            >
              {thematiques.map((theme) => (
                <option key={theme.value} value={theme.value}>
                  {theme.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="tags" className="block text-sm font-medium text-gray-700">
              Tags (séparés par des virgules)
            </label>
            <input
              type="text"
              id="tags"
              name="tags"
              className="input mt-1"
              placeholder="sport, compétition, équipe..."
              value={formData.tags.join(', ')}
              onChange={handleTagsChange}
            />
          </div>

          <div>
            <label htmlFor="evenement_id" className="block text-sm font-medium text-gray-700">
              Événement associé (optionnel)
            </label>
            <input
              type="text"
              id="evenement_id"
              name="evenement_id"
              className="input mt-1"
              placeholder="ID de l'événement"
              value={formData.evenement_id}
              onChange={handleInputChange}
            />
          </div>

          {/* Paramètres de confidentialité */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700">Paramètres de confidentialité</h4>
            
            <div className="flex items-center">
              <input
                id="public"
                name="parametres_confidentialite.public"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                checked={formData.parametres_confidentialite.public}
                onChange={handleInputChange}
              />
              <label htmlFor="public" className="ml-2 block text-sm text-gray-900">
                Vidéo publique
              </label>
            </div>

            <div className="flex items-center">
              <input
                id="commentaires_autorises"
                name="parametres_confidentialite.commentaires_autorises"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                checked={formData.parametres_confidentialite.commentaires_autorises}
                onChange={handleInputChange}
              />
              <label htmlFor="commentaires_autorises" className="ml-2 block text-sm text-gray-900">
                Autoriser les commentaires
              </label>
            </div>

            <div className="flex items-center">
              <input
                id="telechargement_autorise"
                name="parametres_confidentialite.telechargement_autorise"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                checked={formData.parametres_confidentialite.telechargement_autorise}
                onChange={handleInputChange}
              />
              <label htmlFor="telechargement_autorise" className="ml-2 block text-sm text-gray-900">
                Autoriser le téléchargement
              </label>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={removeFile}
              className="btn btn-outline btn-md"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleUpload}
              disabled={!formData.titre.trim()}
              className="btn btn-primary btn-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Publier la vidéo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

