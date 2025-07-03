#!/bin/bash

# Script d'intégration des fonctionnalités IA pour SpotBulle
# Ce script suppose que les fichiers nécessaires sont déjà dans le répertoire ia-integration-files/
# Usage: ./integrate-ia-features.sh

set -e

echo "🚀 Intégration des fonctionnalités IA pour SpotBulle"
echo "=================================================="

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "package.json" ] && [ ! -d "backend" ]; then
    echo "❌ Erreur: Ce script doit être exécuté depuis la racine du projet SpotBulle"
    exit 1
fi

# Fonction pour afficher les étapes
print_step() {
    echo ""
    echo "📋 Étape $1: $2"
    echo "----------------------------------------"
}

# Étape 1: Installation des dépendances backend
print_step "1" "Installation des dépendances backend"
cd backend

echo "📦 Installation de form-data et axios..."
npm install form-data axios --save

if [ $? -eq 0 ]; then
    echo "✅ Dépendances backend installées"
else
    echo "❌ Erreur lors de l'installation des dépendances backend"
    exit 1
fi

cd ..

# Étape 2: Copie des fichiers backend
print_step "2" "Copie des fichiers backend"

# Migration
cp "ia-integration-files/backend/migrations/20250622000000-add-ia-fields-to-videos.js" "backend/migrations/"
echo "✅ Migration de base de données copiée"

# Services
cp "ia-integration-files/backend/src/services/analyseIAService.js" "backend/src/services/"
echo "✅ Service d'analyse IA copié"
cp "ia-integration-files/backend/src/services/miseEnCorrespondanceService.js" "backend/src/services/"
echo "✅ Service de mise en correspondance copié"

# Contrôleurs
cp "ia-integration-files/backend/src/controllers/analyseIAController.js" "backend/src/controllers/"
echo "✅ Contrôleur d'analyse IA copié"
cp "ia-integration-files/backend/src/controllers/miseEnCorrespondanceController.js" "backend/src/controllers/"
echo "✅ Contrôleur de mise en correspondance copié"

# Routes
cp "ia-integration-files/backend/src/routes/analyseIARoutes.js" "backend/src/routes/"
echo "✅ Routes IA copiées"

# Modèle mis à jour
cp "ia-integration-files/backend/src/models/Video_updated.js" "backend/src/models/Video.js"
echo "✅ Modèle Video mis à jour"

# Serveur mis à jour
cp "ia-integration-files/backend/src/server_updated.js" "backend/src/server.js"
echo "✅ Serveur principal mis à jour"

# Étape 3: Copie des fichiers frontend (placeholders pour l'instant)
print_step "3" "Copie des fichiers frontend (placeholders)"

# Composants IA (créer des fichiers vides pour l'exemple)
touch "frontend/src/components/ia/AnalyseIAResults.jsx"
touch "frontend/src/components/ia/RecommandationsProjets.jsx"
touch "frontend/src/components/ia/RechercheProjetsSimilaires.jsx"
echo "✅ Composants frontend IA créés (placeholders)"

# Page IA (créer un fichier vide pour l'exemple)
touch "frontend/src/app/ia/page.jsx"
echo "✅ Page IA créée (placeholder)"

# Étape 4: Configuration de l'environnement (exemple)
print_step "4" "Configuration de l'environnement"

if [ ! -f "backend/.env" ]; then
    echo "OPENAI_API_KEY=your_key_here" > backend/.env
    echo "NLPCLOUD_API_KEY=your_key_here" >> backend/.env
    echo "✅ Fichier .env créé avec des placeholders"
    echo "⚠️  N'oubliez pas de configurer vos clés API dans backend/.env"
else
    echo "⚠️  Fichier .env existant, ajoutez manuellement les nouvelles variables"
    echo "📄 Ajoutez OPENAI_API_KEY et NLPCLOUD_API_KEY à backend/.env"
fi

# Étape 5: Finalisation
print_step "5" "Finalisation"

echo "🎉 Intégration terminée avec succès!"
echo ""
echo "📋 Prochaines étapes:"
echo "1. Exécuter la migration de base de données:"
echo "   cd backend && npx sequelize-cli db:migrate"
echo ""
echo "2. Configurer les clés API dans backend/.env:"
echo "   OPENAI_API_KEY=your_key_here"
echo "   NLPCLOUD_API_KEY=your_key_here"
echo ""
echo "3. Démarrer le serveur backend:"
echo "   cd backend && npm run dev"
echo ""
echo "4. Démarrer le frontend:"
echo "   cd frontend && npm run dev"
echo ""
echo "5. Accéder aux nouvelles fonctionnalités:"
echo "   - Page IA: http://localhost:3000/ia"
echo "   - API IA: http://localhost:5000/api/ia"
echo ""
echo "📚 Consultez GUIDE_INTEGRATION_IA.md pour plus de détails"


