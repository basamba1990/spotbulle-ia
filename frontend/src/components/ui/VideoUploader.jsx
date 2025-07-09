'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { videoAPI, apiUtils } from '../../lib/api';

export default function VideoUploader({ onUploadSuccess, onUploadError }) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [validationErrors, setValidationErrors] = useState([]);
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
    // Réinitialiser les erreurs
    setUploadError(null);
    setValidationErrors([]);

    if (rejectedFiles.length > 0) {
      const errors = rejectedFiles[0].errors.map(error => error.message);
      setValidationErrors(errors);
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
  }, [formData.titre]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.avi', '.mov', '.wmv', '.webm', '.3gp', '.3g2'],
    },
    maxFiles: 1,
    maxSize: parseInt(process.env.NEXT_PUBLIC_MAX_FILE_SIZE) || 104857600, // 100MB
    multiple: false,
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Réinitialiser les erreurs lors de la saisie
    setValidationErrors([]);
    
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

  const validateForm = () => {
    const errors = [];
    
    if (!selectedFile) {
      errors.push('Veuillez sélectionner un fichier vidéo');
    }
    
    if (!formData.titre.trim()) {
      errors.push('Le titre est obligatoire');
    } else if (formData.titre.trim().length < 3) {
      errors.push('Le titre doit contenir au moins 3 caractères');
    } else if (formData.titre.trim().length > 255) {
      errors.push('Le titre ne peut pas dépasser 255 caractères');
    }
    
    if (formData.description && formData.description.length > 1000) {
      errors.push('La description ne peut pas dépasser 1000 caractères');
    }
    
    if (formData.tags.length > 10) {
      errors.push('Vous ne pouvez pas ajouter plus de 10 tags');
    }
    
    // Valider chaque tag
    formData.tags.forEach((tag, index) => {
      if (tag.length > 50) {
        errors.push(`Le tag "${tag}" est trop long (maximum 50 caractères)`);
      }
    });
    
    return errors;
  };

  const handleUpload = async () => {
    // Validation du formulaire
    const errors = validateForm();
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadError(null);
    setValidationErrors([]);

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('video', selectedFile);
      uploadFormData.append('titre', formData.titre.trim());
      uploadFormData.append('description', formData.description.trim());
      uploadFormData.append('thematique', formData.thematique);
      uploadFormData.append('tags', JSON.stringify(formData.tags));
      uploadFormData.append('parametres_confidentialite', JSON.stringify(formData.parametres_confidentialite));
      
      if (formData.evenement_id) {
        uploadFormData.append('evenement_id', formData.evenement_id);
      }

      // Fonction de progression d'upload
      const onUploadProgress = (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress(percentCompleted);
      };

      const response = await videoAPI.uploadVideo(uploadFormData, onUploadProgress);
      
      // Finaliser la progression
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
      }, 1000);

    } catch (error) {
      setIsUploading(false);
      setUploadProgress(0);
      
      const errorData = apiUtils.handleError(error);
      setUploadError(errorData.message);
      
      // Afficher les erreurs de validation du serveur
      if (errorData.errors && errorData.errors.length > 0) {
        setValidationErrors(errorData.errors.map(err => err.msg || err.message || err));
      }
      
      onUploadError?.(errorData.message);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setUploadProgress(0);
    setUploadError(null);
    setValidationErrors([]);
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
        className={`dropzone ${isDragActive ? 'active' : ''} ${isDragReject ? 'reject' : ''} ${selectedFile ? 'has-file' : ''}`}
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
              className="mt-2 text-sm text-red-600 hover:text-red-700 focus:outline-none focus:underline"
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
                    <span className="font-medium text-blue-600 cursor-pointer">Cliquez pour sélectionner</span> ou glissez-déposez votre vidéo
                  </>
                )}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                MP4, AVI, MOV, WMV, WebM jusqu'à {apiUtils.formatFileSize(parseInt(process.env.NEXT_PUBLIC_MAX_FILE_SIZE) || 104857600)}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Messages d'erreur */}
      {(uploadError || validationErrors.length > 0) && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
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
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-red-800">
                {validationErrors.length > 0 ? 'Erreurs de validation' : 'Erreur d\'upload'}
              </h3>
              <div className="text-sm text-red-700 mt-1">
                {uploadError && <p>{uploadError}</p>}
                {validationErrors.length > 0 && (
                  <ul className="list-disc list-inside space-y-1">
                    {validationErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={() => {
                  setUploadError(null);
                  setValidationErrors([]);
                }}
                className="text-red-400 hover:text-red-600 focus:outline-none"
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
          {uploadProgress < 100 && (
            <p className="text-xs text-gray-500 text-center">
              Ne fermez pas cette page pendant l'upload
            </p>
          )}
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
              className="input mt-1 w-full"
              placeholder="Donnez un titre à votre vidéo"
              value={formData.titre}
              onChange={handleInputChange}
              maxLength={255}
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.titre.length}/255 caractères
            </p>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              className="textarea mt-1 w-full"
              placeholder="Décrivez votre vidéo..."
              value={formData.description}
              onChange={handleInputChange}
              maxLength={1000}
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.description.length}/1000 caractères
            </p>
          </div>

          <div>
            <label htmlFor="thematique" className="block text-sm font-medium text-gray-700">
              Thématique
            </label>
            <select
              id="thematique"
              name="thematique"
              className="input mt-1 w-full"
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
              className="input mt-1 w-full"
              placeholder="sport, compétition, équipe..."
              value={formData.tags.join(', ')}
              onChange={handleTagsChange}
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.tags.length}/10 tags
            </p>
          </div>

          <div>
            <label htmlFor="evenement_id" className="block text-sm font-medium text-gray-700">
              Événement associé (optionnel)
            </label>
            <input
              type="text"
              id="evenement_id"
              name="evenement_id"
              className="input mt-1 w-full"
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

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={removeFile}
              className="btn btn-outline btn-md"
              disabled={isUploading}
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleUpload}
              disabled={!formData.titre.trim() || isUploading}
              className="btn btn-primary btn-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? 'Upload en cours...' : 'Publier la vidéo'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

