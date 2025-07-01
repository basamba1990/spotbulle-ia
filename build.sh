#!/bin/bash

set -e # Exit immediately if a command exits with a non-zero status.

# SOLUTION IMMEDIATE - Script de build modifié pour éviter les problèmes de cache Render
echo "🚀 SOLUTION IMMEDIATE - Build SpotBulle IA v2.0"
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

# Frontend  
echo "📦 Installation frontend..."
cd ../frontend
npm install --no-audit --no-fund
echo "✅ Frontend prêt"

# Vérification simple
echo "🔍 Vérification..."
if [ ! -d "node_modules/tailwindcss" ]; then
  echo "❌ tailwindcss manquant"
  exit 1
fi
echo "✅ tailwindcss trouvé"

# Build
echo "🏗️ Build Next.js..."
npm run build

# Vérification du build
if [ ! -d ".next" ] || [ ! -f ".next/BUILD_ID" ]; then
  echo "❌ Build échoué"
  exit 1
fi

echo "✅ Build réussi - BUILD_ID: $(cat .next/BUILD_ID)"

# Copie des fichiers statiques
echo "📁 Copie des assets..."
cd ..
mkdir -p public/static
if [ -d "frontend/.next/static" ]; then
  cp -r frontend/.next/static/* public/static/ 2>/dev/null || true
fi

echo "🎉 SOLUTION IMMEDIATE - Build terminé avec succès !"

