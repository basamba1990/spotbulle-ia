#!/bin/bash

set -e # Exit immediately if a command exits with a non-zero status.

echo "🚀 Build SpotBulle IA v2.0"
echo "🔧 Node version: $(node --version)"
echo "🔧 NPM version: $(npm --version)"
echo "🔧 Environment: ${NODE_ENV:-development}"

# Configurer les variables d'environnement
export NODE_ENV=production
export NEXT_PUBLIC_API_URL="https://spotbulle-ia.onrender.com"
export NEXT_TELEMETRY_DISABLED=1
export CI=true
export NODE_OPTIONS="--max-old-space-size=4096"

# Nettoyer complètement
echo "🧹 Nettoyage complet..."
rm -rf node_modules package-lock.json
rm -rf backend/node_modules backend/package-lock.json  
rm -rf frontend/node_modules frontend/package-lock.json frontend/.next
npm cache clean --force

# Backend
echo "📦 Installation backend..."
cd backend
npm install --only=production --no-audit --no-fund
echo "✅ Backend prêt"
cd .. # Retour au répertoire racine

# Frontend
echo "📦 Installation frontend..."
cd frontend
npm install --no-audit --no-fund
echo "✅ Frontend prêt"

# Build Frontend
echo "🏗️ Build Next.js..."
npm run build

# Vérification du build frontend
if [ ! -d ".next" ] || [ ! -f ".next/BUILD_ID" ]; then
  echo "❌ Build frontend échoué"
  exit 1
fi
echo "✅ Build frontend réussi - BUILD_ID: $(cat .next/BUILD_ID)"

# Copie des fichiers statiques du frontend vers le répertoire public du backend
echo "📁 Copie des assets du frontend vers le répertoire public du backend..."
cd .. # Retour au répertoire racine du projet
mkdir -p public/static

# Supprimer le contenu existant pour éviter les conflits
rm -rf public/static/*

# Copier les fichiers statiques de Next.js
if [ -d "frontend/.next/static" ]; then
  cp -r frontend/.next/static/* public/static/ || { echo "❌ Erreur lors de la copie des fichiers statiques Next.js."; exit 1; }
else
  echo "⚠️ Le répertoire frontend/.next/static n'existe pas. Vérifiez le build du frontend."
fi

# Copier les fichiers publics du frontend (si existants)
if [ -d "frontend/public" ]; then
  cp -r frontend/public/* public/ || { echo "❌ Erreur lors de la copie des fichiers publics du frontend."; exit 1; }
else
  echo "⚠️ Le répertoire frontend/public n'existe pas."
fi

echo "🎉 Build terminé avec succès !"


