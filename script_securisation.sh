#!/bin/bash

# Script de sécurisation SpotBulle IA
# Ce script aide à sécuriser l'application en supprimant les secrets exposés

echo "🔒 Script de Sécurisation SpotBulle IA"
echo "======================================"

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Vérifier si on est dans le bon répertoire
if [ ! -f "package.json" ] && [ ! -d "frontend" ] && [ ! -d "backend" ]; then
    log_error "Ce script doit être exécuté depuis la racine du projet SpotBulle IA"
    exit 1
fi

log_info "Début de la sécurisation..."

# 1. Supprimer les fichiers .env exposés
log_info "Étape 1: Suppression des fichiers .env exposés"

if [ -f "backend/.env" ]; then
    log_warning "Fichier backend/.env trouvé - SUPPRESSION"
    git rm --cached backend/.env 2>/dev/null || rm backend/.env
    log_success "Fichier backend/.env supprimé"
else
    log_success "Aucun fichier backend/.env trouvé"
fi

if [ -f "frontend/.env" ]; then
    log_warning "Fichier frontend/.env trouvé - SUPPRESSION"
    git rm --cached frontend/.env 2>/dev/null || rm frontend/.env
    log_success "Fichier frontend/.env supprimé"
fi

if [ -f "frontend/.env.local" ]; then
    log_warning "Fichier frontend/.env.local trouvé - SUPPRESSION"
    git rm --cached frontend/.env.local 2>/dev/null || rm frontend/.env.local
    log_success "Fichier frontend/.env.local supprimé"
fi

# 2. Créer/Mettre à jour .gitignore
log_info "Étape 2: Mise à jour du .gitignore"

cat > .gitignore << 'EOF'
# Secrets et configuration sensible
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
.env.staging
*.env
backend/.env
frontend/.env
frontend/.env.local

# Dépendances
node_modules/
.npm
.yarn/cache

# Build et cache
.next/
dist/
build/
.cache/

# Logs
logs/
*.log

# Base de données
*.sqlite
*.db

# Uploads
uploads/
public/uploads/

# IDE
.vscode/
.idea/

# Système
.DS_Store
Thumbs.db

# Déploiement
.vercel
.netlify/

# Sauvegardes
backup_*.json
backup_*.sql
*.backup
EOF

log_success ".gitignore mis à jour"

# 3. Créer des templates d'environnement
log_info "Étape 3: Création des templates d'environnement"

# Template backend
cat > backend/.env.example << 'EOF'
# Configuration Backend SpotBulle IA
# Copiez ce fichier vers .env et remplissez avec vos vraies valeurs

NODE_ENV=production
PORT=10000

# Base de données PostgreSQL
DATABASE_URL=postgresql://username:password@host:port/database

# JWT Secret (générez avec: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
JWT_SECRET=VOTRE_NOUVELLE_CLE_JWT_SECRETE_ICI
JWT_EXPIRES_IN=7d

# Supabase
SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_ANON_KEY=VOTRE_CLE_ANON_SUPABASE
SUPABASE_SERVICE_ROLE_KEY=VOTRE_CLE_SERVICE_SUPABASE
BUCKET_NAME=pitch-videos

# OpenAI
OPENAI_API_KEY=VOTRE_CLE_OPENAI

# NLPCloud
NLPCLOUD_API_KEY=VOTRE_CLE_NLPCLOUD

# Configuration
FRONTEND_URL=https://spotbulle-ia.vercel.app
MAX_FILE_SIZE=250MB
ALLOWED_VIDEO_TYPES=mp4,avi,mov,wmv,flv,webm
EOF

log_success "Template backend/.env.example créé"

# Template frontend
cat > frontend/.env.example << 'EOF'
# Configuration Frontend SpotBulle IA
# Copiez ce fichier vers .env.local et remplissez avec vos vraies valeurs

# URL de l'API Backend
NEXT_PUBLIC_API_URL=https://spotbulle-ia.onrender.com

# Supabase (clés publiques uniquement)
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=VOTRE_CLE_ANON_SUPABASE

# Configuration de l'application
NEXT_PUBLIC_APP_NAME=SpotBulle IA
NEXT_PUBLIC_APP_URL=https://spotbulle-ia.vercel.app
NEXT_PUBLIC_MAX_FILE_SIZE=250000000
NEXT_PUBLIC_ALLOWED_VIDEO_TYPES=mp4,avi,mov,wmv,flv,webm
EOF

log_success "Template frontend/.env.example créé"

# 4. Générer une nouvelle clé JWT
log_info "Étape 4: Génération d'une nouvelle clé JWT"

if command -v node &> /dev/null; then
    NEW_JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
    echo ""
    log_success "Nouvelle clé JWT générée:"
    echo -e "${GREEN}JWT_SECRET=${NEW_JWT_SECRET}${NC}"
    echo ""
    log_warning "IMPORTANT: Copiez cette clé dans vos variables d'environnement Render"
else
    log_warning "Node.js non trouvé. Générez manuellement une clé JWT de 64 caractères"
fi

# 5. Instructions de sécurisation
echo ""
log_info "Étape 5: Instructions de sécurisation"
echo ""
echo "🔑 ACTIONS REQUISES IMMÉDIATEMENT:"
echo ""
echo "1. RÉVOQUER LES CLÉS API EXPOSÉES:"
echo "   - OpenAI: https://platform.openai.com/api-keys"
echo "   - Supabase: Votre projet > Settings > API"
echo ""
echo "2. CONFIGURER LES NOUVELLES VARIABLES D'ENVIRONNEMENT:"
echo "   - Render (Backend): Dashboard > Service > Environment"
echo "   - Vercel (Frontend): Dashboard > Project > Settings > Environment Variables"
echo ""
echo "3. UTILISER LES TEMPLATES CRÉÉS:"
echo "   - Copiez backend/.env.example vers backend/.env (local uniquement)"
echo "   - Copiez frontend/.env.example vers frontend/.env.local (local uniquement)"
echo ""
echo "4. COMMITER LES CHANGEMENTS:"
echo "   git add ."
echo "   git commit -m \"Security: Remove exposed secrets and add .gitignore\""
echo "   git push"
echo ""

# 6. Vérification finale
log_info "Étape 6: Vérification finale"

# Vérifier qu'aucun secret n'est présent
if grep -r "sk-" . --exclude-dir=node_modules --exclude-dir=.git 2>/dev/null | grep -v ".example" | grep -v "script_securisation.sh"; then
    log_error "ATTENTION: Des clés API sont encore présentes dans le code!"
else
    log_success "Aucune clé API trouvée dans le code"
fi

if grep -r "eyJ" . --exclude-dir=node_modules --exclude-dir=.git 2>/dev/null | grep -v ".example" | grep -v "script_securisation.sh"; then
    log_error "ATTENTION: Des tokens JWT sont encore présents dans le code!"
else
    log_success "Aucun token JWT trouvé dans le code"
fi

echo ""
log_success "Sécurisation terminée!"
log_warning "N'oubliez pas de configurer les nouvelles variables d'environnement sur Render et Vercel"
echo ""

