

'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({ error, reset }) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 text-gray-800">
      <h1 className="text-6xl font-bold text-red-600">500</h1>
      <h2 className="text-2xl font-semibold mt-4">Une erreur est survenue</h2>
      <p className="mt-2 text-lg text-gray-600">
        Désolé, quelque chose s'est mal passé. Nous travaillons à résoudre le problème.
      </p>
      <p className="mt-2 text-sm text-gray-500">
        {error.message}
      </p>
      <button
        className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-md shadow-md hover:bg-blue-700 transition duration-300"
        onClick={() => reset()}
      >
        Réessayer
      </button>
      <Link
        href="/"
        className="mt-4 text-blue-600 hover:underline"
      >
        Retour à l'accueil
      </Link>
    </div>
  );
}


