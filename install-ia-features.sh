#!/bin/bash

# Script d'installation automatique des fonctionnalités IA pour SpotBulle
# Usage: ./install-ia-features.sh

set -e

echo "🚀 Installation des fonctionnalités IA pour SpotBulle"
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

# Étape 1: Sauvegarde
print_step "1" "Sauvegarde des fichiers existants"
BACKUP_DIR="backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

if [ -f "backend/src/models/Video.js" ]; then
    cp "backend/src/models/Video.js" "$BACKUP_DIR/Video.js.bak"
    echo "✅ Sauvegarde du modèle Video"
fi

if [ -f "backend/src/server.js" ]; then
    cp "backend/src/server.js" "$BACKUP_DIR/server.js.bak"
    echo "✅ Sauvegarde du serveur"
fi

echo "📁 Sauvegarde créée dans: $BACKUP_DIR"

# Étape 2: Installation des dépendances backend
print_step "2" "Installation des dépendances backend"
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

# Étape 3: Création des dossiers nécessaires
print_step "3" "Création de la structure de dossiers"

mkdir -p backend/src/services
mkdir -p backend/src/controllers
mkdir -p frontend/src/components/ia
mkdir -p frontend/src/app/ia

echo "✅ Structure de dossiers créée"

# Étape 4: Application de la migration de base de données
print_step "4" "Préparation de la migration de base de données"

if [ -f "ia-integration-files/backend/migrations/20250622000000-add-ia-fields-to-videos.js" ]; then
    cp "ia-integration-files/backend/migrations/20250622000000-add-ia-fields-to-videos.js" "backend/migrations/"
    echo "✅ Migration de base de données préparée"
    echo "⚠️  N'oubliez pas d'exécuter: cd backend && npx sequelize-cli db:migrate"
else
    echo "⚠️  Fichier de migration non trouvé, création manuelle nécessaire"
fi

# Étape 5: Copie des fichiers backend
print_step "5" "Installation des fichiers backend"

# Services
if [ -f "ia-integration-files/backend/src/services/analyseIAService.js" ]; then
    cp "ia-integration-files/backend/src/services/analyseIAService.js" "backend/src/services/"
    echo "✅ Service d'analyse IA installé"
fi

if [ -f "ia-integration-files/backend/src/services/miseEnCorrespondanceService.js" ]; then
    cp "ia-integration-files/backend/src/services/miseEnCorrespondanceService.js" "backend/src/services/"
    echo "✅ Service de mise en correspondance installé"
fi

# Contrôleurs
if [ -f "ia-integration-files/backend/src/controllers/analyseIAController.js" ]; then
    cp "ia-integration-files/backend/src/controllers/analyseIAController.js" "backend/src/controllers/"
    echo "✅ Contrôleur d'analyse IA installé"
fi

if [ -f "ia-integration-files/backend/src/controllers/miseEnCorrespondanceController.js" ]; then
    cp "ia-integration-files/backend/src/controllers/miseEnCorrespondanceController.js" "backend/src/controllers/"
    echo "✅ Contrôleur de mise en correspondance installé"
fi

# Routes
if [ -f "ia-integration-files/backend/src/routes/analyseIARoutes.js" ]; then
    cp "ia-integration-files/backend/src/routes/analyseIARoutes.js" "backend/src/routes/"
    echo "✅ Routes IA installées"
fi

# Modèle mis à jour
if [ -f "ia-integration-files/backend/src/models/Video_updated.js" ]; then
    cp "ia-integration-files/backend/src/models/Video_updated.js" "backend/src/models/Video.js"
    echo "✅ Modèle Video mis à jour"
fi

# Serveur mis à jour
if [ -f "ia-integration-files/backend/src/server_updated.js" ]; then
    cp "ia-integration-files/backend/src/server_updated.js" "backend/src/server.js"
    echo "✅ Serveur principal mis à jour"
fi

# Étape 6: Copie des fichiers frontend
print_step "6" "Installation des fichiers frontend"

# Composants IA
if [ -f "ia-integration-files/frontend/src/components/ia/AnalyseIAResults.jsx" ]; then
    cp "ia-integration-files/frontend/src/components/ia/AnalyseIAResults.jsx" "frontend/src/components/ia/"
    echo "✅ Composant AnalyseIAResults installé"
fi

if [ -f "ia-integration-files/frontend/src/components/ia/RecommandationsProjets.jsx" ]; then
    cp "ia-integration-files/frontend/src/components/ia/RecommandationsProjets.jsx" "frontend/src/components/ia/"
    echo "✅ Composant RecommandationsProjets installé"
fi

if [ -f "ia-integration-files/frontend/src/components/ia/RechercheProjetsSimilaires.jsx" ]; then
    cp "ia-integration-files/frontend/src/components/ia/RechercheProjetsSimilaires.jsx" "frontend/src/components/ia/"
    echo "✅ Composant RechercheProjetsSimilaires installé"
fi

# Page IA
if [ -f "ia-integration-files/frontend/src/app/ia/page.jsx" ]; then
    cp "ia-integration-files/frontend/src/app/ia/page.jsx" "frontend/src/app/ia/"
    echo "✅ Page IA installée"
fi

# Étape 7: Configuration de l'environnement
print_step "7" "Configuration de l'environnement"

if [ -f "ia-integration-files/backend/.env.example" ]; then
    if [ ! -f "backend/.env" ]; then
        cp "ia-integration-files/backend/.env.example" "backend/.env"
        echo "✅ Fichier .env créé à partir de l'exemple"
        echo "⚠️  N'oubliez pas de configurer vos clés API dans backend/.env"
    else
        echo "⚠️  Fichier .env existant, ajoutez manuellement les nouvelles variables"
        echo "📄 Consultez backend/.env.example pour les nouvelles variables"
    fi
fi

# Étape 8: Tests
print_step "8" "Exécution des tests"

if [ -f "ia-integration-files/backend/test-ia-simple.js" ]; then
    cp "ia-integration-files/backend/test-ia-simple.js" "backend/"
    echo "✅ Script de test installé"
    
    echo "🧪 Exécution des tests..."
    cd backend
    if node test-ia-simple.js; then
        echo "✅ Tests réussis"
    else
        echo "⚠️  Certains tests ont échoué, mais l'installation peut continuer"
    fi
    cd ..
fi

# Étape 9: Finalisation
print_step "9" "Finalisation"

echo "🎉 Installation terminée avec succès!"
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
echo ""
echo "🔧 En cas de problème, restaurez depuis: $BACKUP_DIR"

