'use client';

import { useState, useEffect } from 'react';

export default function SuccessNotification({ 
  show, 
  message, 
  onClose, 
  autoClose = true, 
  duration = 5000 
}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      
      if (autoClose) {
        const timer = setTimeout(() => {
          setIsVisible(false);
          setTimeout(() => {
            onClose && onClose();
          }, 300); // Attendre la fin de l'animation
        }, duration);
        
        return () => clearTimeout(timer);
      }
    } else {
      setIsVisible(false);
    }
  }, [show, autoClose, duration, onClose]);

  if (!show) return null;

  return (
    <div className={`fixed top-4 right-4 z-50 transition-all duration-300 transform ${
      isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
    }`}>
      <div className="bg-green-50 border border-green-200 rounded-lg shadow-lg p-4 max-w-sm">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg 
              className="h-5 w-5 text-green-400" 
              viewBox="0 0 20 20" 
              fill="currentColor"
            >
              <path 
                fillRule="evenodd" 
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" 
                clipRule="evenodd" 
              />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-green-800">
              Inscription réussie !
            </h3>
            <div className="mt-1 text-sm text-green-700">
              {message || 'Votre compte a été créé avec succès. Vous êtes maintenant connecté.'}
            </div>
          </div>
          <div className="ml-4 flex-shrink-0">
            <button
              type="button"
              onClick={() => {
                setIsVisible(false);
                setTimeout(() => {
                  onClose && onClose();
                }, 300);
              }}
              className="inline-flex text-green-400 hover:text-green-600 focus:outline-none focus:text-green-600 transition-colors duration-200"
            >
              <span className="sr-only">Fermer</span>
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
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
    </div>
  );
}

