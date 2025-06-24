'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function TestAuthPage() {
  const { user, isAuthenticated, isLoading, token, login, logout } = useAuth();
  const [loginData, setLoginData] = useState({
    email: 'basamba1990@spotbulle.com',
    password: 'Spot@2050'
  });

  const handleLogin = async () => {
    const result = await login(loginData);
    console.log('Résultat de connexion:', result);
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Test d'authentification</h1>
        
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">État actuel</h2>
          <div className="space-y-2">
            <p><strong>Chargement:</strong> {isLoading ? 'Oui' : 'Non'}</p>
            <p><strong>Authentifié:</strong> {isAuthenticated ? 'Oui' : 'Non'}</p>
            <p><strong>Token:</strong> {token ? 'Présent' : 'Absent'}</p>
            <p><strong>Utilisateur:</strong> {user ? JSON.stringify(user, null, 2) : 'Aucun'}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Actions</h2>
          <div className="space-x-4">
            <button 
              onClick={handleLogin}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Se connecter
            </button>
            <button 
              onClick={handleLogout}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Se déconnecter
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Logs de débogage</h2>
          <div id="debug-logs" className="bg-gray-100 p-4 rounded text-sm font-mono">
            Ouvrez la console pour voir les logs détaillés
          </div>
        </div>
      </div>
    </div>
  );
}

