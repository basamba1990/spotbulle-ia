#!/bin/bash

# Script pour construire le frontend Next.js

echo "🚀 Démarrage de la construction du frontend Next.js..."

# Aller dans le répertoire du frontend
cd frontend

# Installer les dépendances
echo "Installing frontend dependencies..."
npm install --production=false || { echo "❌ Erreur lors de l'installation des dépendances du frontend."; exit 1; }

# Construire l'application Next.js
echo "Building Next.js application..."
npm run build || { echo "❌ Erreur lors de la construction de l'application Next.js."; exit 1; }

# Retourner au répertoire racine
cd ..

echo "✅ Construction du frontend Next.js terminée avec succès."


