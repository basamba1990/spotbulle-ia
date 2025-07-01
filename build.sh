#!/bin/bash

set -e # Exit immediately if a command exits with a non-zero status.

# Afficher les informations de l'environnement
echo "🔧 Node version: $(node --version)"
echo "🔧 NPM version: $(npm --version)"
echo "🔧 Environment: ${NODE_ENV:-development}"

# Configurer les variables d'environnement pour le build
export NODE_ENV=production
export NEXT_PUBLIC_API_URL="https://spotbulle-ia.onrender.com"
export NEXT_TELEMETRY_DISABLED=1
export CI=true
export NODE_OPTIONS="--max-old-space-size=4096"

# Nettoyer les caches npm
echo "🧹 Nettoyage des caches npm..."
npm cache clean --force

# Installer les dépendances du backend
echo "📦 Installation des dépendances backend..."
cd backend
npm ci --only=production --no-audit --no-fund
echo "✅ Dépendances backend installées"

# Installer les dépendances du frontend
echo "📦 Installation des dépendances frontend..."
cd ../frontend
npm ci --no-audit --no-fund
echo "✅ Dépendances frontend installées"

# Vérifier que les dépendances critiques sont installées
echo "🔍 Vérification des dépendances critiques..."
node -e "console.log('✅ next:', require('next/package.json').version)"
node -e "console.log('✅ tailwindcss:', require('tailwindcss/package.json').version)"
node -e "console.log('✅ sharp:', require('sharp/package.json').version)"

# Build du frontend Next.js
echo "🏗️ Build du frontend Next.js..."
npm run build

# Vérifier que le build a réussi
if [ ! -d ".next" ]; then
  echo "❌ Le répertoire .next n'existe pas après le build"
  exit 1
fi

if [ ! -f ".next/BUILD_ID" ]; then
  echo "❌ BUILD_ID manquant, le build Next.js a échoué"
  exit 1
fi

echo "✅ Build Next.js réussi, BUILD_ID: $(cat .next/BUILD_ID)"

# Copier les fichiers statiques vers le répertoire public
echo "📁 Copie des fichiers statiques..."
mkdir -p ../public/static
if [ -d ".next/static" ]; then
  cp -r .next/static/* ../public/static/ 2>/dev/null || echo "⚠️ Aucun fichier statique à copier"
  echo "✅ Fichiers statiques copiés"
else
  echo "⚠️ Répertoire .next/static non trouvé"
fi

# Retourner au répertoire racine
cd ..

# Afficher un résumé du build
echo "📊 Résumé du build:"
echo "  - Backend: $(ls -1 backend/node_modules 2>/dev/null | wc -l) modules"
echo "  - Frontend: $(ls -1 frontend/node_modules 2>/dev/null | wc -l) modules"
echo "  - Build Next.js: $(du -sh frontend/.next 2>/dev/null || echo 'N/A')"
echo "  - Fichiers statiques: $(ls -1 public/static 2>/dev/null | wc -l || echo '0') fichiers"

echo "✅ Build terminé avec succès"

