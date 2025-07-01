#!/bin/bash

set -e # Exit immediately if a command exits with a non-zero status.

# Afficher les informations de l\'environnement
echo "🔧 Node version: $(node --version)"
echo "🔧 NPM version: $(npm --version)"
echo "🔧 Environment: $NODE_ENV"

# Nettoyer complètement les caches et dépendances
echo "🧹 Nettoyage des caches..."
rm -rf node_modules package-lock.json
rm -rf backend/node_modules backend/package-lock.json
rm -rf frontend/node_modules frontend/package-lock.json frontend/.next frontend/out
npm cache clean --force

# Configurer les variables d\'environnement pour le build
export NODE_ENV=production
export NEXT_PUBLIC_API_URL="https://spotbulle-ia.onrender.com"
export NEXT_TELEMETRY_DISABLED=1
export CI=true

# Installer les dépendances du backend
echo "📦 Installation des dépendances backend..."
cd backend
npm install --no-audit --no-fund # Utiliser npm install pour générer un nouveau package-lock.json

# Installer les dépendances du frontend avec les corrections
echo "📦 Installation des dépendances frontend..."
cd ../frontend

# Ajouter les dépendances manquantes avant l\'installation
npm install --save critters@0.0.24 sharp@0.33.2
npm install --no-audit --no-fund # Utiliser npm install pour générer un nouveau package-lock.json

# Forcer l\'installation de tailwindcss en tant que dépendance de production
echo "⚠️ Installation forcée de tailwindcss en tant que dépendance de production..."
npm install tailwindcss@latest --save --no-audit --no-fund

# Vérifier que les dépendances critiques sont installées
echo "🔍 Vérification des dépendances critiques..."
node -e "try { console.log(\'✅ critters:\', require(\'critters/package.json\').version); } catch (e) { console.log(\'⚠️ critters package.json non accessible directement\'); }"
node -e "try { console.log(\'✅ sharp:\', require(\'sharp/package.json\').version); } catch (e) { console.log(\'⚠️ sharp package.json non accessible directement\'); }"
node -e "console.log(\'✅ next:\', require(\'next/package.json\').version)"
node -e "console.log(\'✅ tailwindcss:\', require(\'tailwindcss/package.json\').version)"

# Vérifier si tailwindcss est accessible dans le node_modules du frontend
if [ ! -d "./node_modules/tailwindcss" ]; then
  echo "❌ tailwindcss n\'est pas trouvé dans ./node_modules/tailwindcss. Le build va échouer."
  exit 1
fi

# Build du frontend Next.js avec gestion d\'erreurs améliorée
echo "🏗️ Build du frontend Next.js..."

# Augmenter la mémoire disponible pour Node.js
export NODE_OPTIONS="--max-old-space-size=4096"

# Ajouter le chemin de résolution de tailwindcss explicitement
# Cela force Node.js à chercher tailwindcss dans le node_modules du frontend
export NODE_PATH="./node_modules:$(npm root -g)"

# Lancer le build avec retry en cas d\'échec
npm run build || (\
  echo "❌ Premier build échoué, nettoyage et retry..." && \
  rm -rf .next && \
  npm run build || (\
    echo "❌ Second build échoué, affichage des logs détaillés..." && \
    npm run build --verbose || exit 1\
  )\
)

# Vérifier que le build a réussi
if [ ! -d ".next" ]; then
  echo "❌ Le répertoire .next n\'existe pas après le build"
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
echo "  - Backend: $(ls -la backend/node_modules | wc -l) modules"
echo "  - Frontend: $(ls -la frontend/node_modules | wc -l) modules"
echo "  - Build Next.js: $(du -sh frontend/.next 2>/dev/null || echo \'N/A\')"
echo "  - Fichiers statiques: $(ls -la public/static 2>/dev/null | wc -l || echo \'0\') fichiers"

echo "✅ Build terminé avec succès"


