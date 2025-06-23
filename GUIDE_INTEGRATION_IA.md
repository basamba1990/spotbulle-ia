# Guide d'Intégration des Fonctionnalités IA - SpotBulle

## Vue d'ensemble

Ce guide vous accompagne dans l'intégration des nouvelles fonctionnalités d'Intelligence Artificielle dans SpotBulle IA. Ces fonctionnalités incluent :

- **Analyse automatique des pitchs** : Transcription, extraction de mots-clés, génération de résumés
- **Mise en correspondance de projets** : Recommandations basées sur la similarité sémantique
- **Recherche de collaborateurs** : Identification de partenaires potentiels

## Prérequis

### 1. Environnement technique
- Node.js 18+ 
- PostgreSQL 12+
- Accès aux APIs d'IA (optionnel, mode fallback disponible)

### 2. Clés API (optionnelles)
- **OpenAI API** : Pour la transcription Whisper et les embeddings
- **NLP Cloud API** : Pour l'analyse de texte avancée

## Étapes d'intégration

### Étape 1: Mise à jour de la base de données

1. **Appliquer la nouvelle migration**
```bash
cd backend
# Copier le fichier de migration
cp migrations/20250622000000-add-ia-fields-to-videos.js ./migrations/
# Exécuter la migration
npx sequelize-cli db:migrate
```

2. **Mettre à jour le modèle Video**
```bash
# Remplacer le fichier existant
cp src/models/Video_updated.js src/models/Video.js
```

### Étape 2: Installation des dépendances backend

```bash
cd backend
npm install form-data axios
```

### Étape 3: Ajout des nouveaux services

1. **Service d'analyse IA**
```bash
# Créer le dossier services s'il n'existe pas
mkdir -p src/services
# Copier le service d'analyse IA
cp src/services/analyseIAService.js ./src/services/
```

2. **Service de mise en correspondance**
```bash
# Copier le service de mise en correspondance
cp src/services/miseEnCorrespondanceService.js ./src/services/
```

### Étape 4: Ajout des contrôleurs

```bash
# Copier les nouveaux contrôleurs
cp src/controllers/analyseIAController.js ./src/controllers/
cp src/controllers/miseEnCorrespondanceController.js ./src/controllers/
```

### Étape 5: Mise à jour des routes

```bash
# Copier les nouvelles routes
cp src/routes/analyseIARoutes_updated.js src/routes/analyseIARoutes.js
```

### Étape 6: Mise à jour du serveur principal

```bash
# Remplacer le fichier server.js
cp src/server_updated.js src/server.js
```

### Étape 7: Configuration de l'environnement

1. **Copier le fichier d'exemple**
```bash
cp .env.example .env
```

2. **Configurer les variables d'environnement**
```bash
# Éditer le fichier .env et ajouter :
OPENAI_API_KEY=your_openai_api_key_here
NLPCLOUD_API_KEY=your_nlpcloud_api_key_here
ENABLE_AI_FEATURES=true
AI_FALLBACK_MODE=true
```

### Étape 8: Intégration frontend

1. **Créer le dossier des composants IA**
```bash
cd frontend
mkdir -p src/components/ia
```

2. **Copier les composants IA**
```bash
cp src/components/ia/AnalyseIAResults.jsx ./src/components/ia/
cp src/components/ia/RecommandationsProjets.jsx ./src/components/ia/
cp src/components/ia/RechercheProjetsSimilaires.jsx ./src/components/ia/
```

3. **Ajouter la page IA**
```bash
mkdir -p src/app/ia
cp src/app/ia/page.jsx ./src/app/ia/
```

### Étape 9: Tests

1. **Tester les fonctionnalités de base**
```bash
cd backend
node test-ia-simple.js
```

2. **Démarrer le serveur backend**
```bash
npm run dev
```

3. **Démarrer le frontend**
```bash
cd ../frontend
npm run dev
```

## Configuration des APIs d'IA

### OpenAI API (Recommandé)

1. Créer un compte sur [OpenAI Platform](https://platform.openai.com/)
2. Générer une clé API
3. Ajouter la clé dans `.env` : `OPENAI_API_KEY=sk-...`

**Fonctionnalités activées :**
- Transcription audio avec Whisper
- Génération d'embeddings pour la similarité
- Résumés automatiques avec GPT

### NLP Cloud API (Optionnel)

1. Créer un compte sur [NLP Cloud](https://nlpcloud.com/)
2. Générer une clé API
3. Ajouter la clé dans `.env` : `NLPCLOUD_API_KEY=...`

**Fonctionnalités activées :**
- Extraction de mots-clés avancée
- Analyse de sentiment

### Mode Fallback

Si aucune clé API n'est configurée, le système utilise automatiquement des algorithmes de fallback :
- Transcription simulée pour les tests
- Extraction de mots-clés basée sur la fréquence
- Embeddings générés algorithmiquement
- Résumés basés sur les premières phrases

## Nouvelles routes API

### Routes d'analyse IA

- `POST /api/ia/videos/:videoId/analyser` - Lance l'analyse IA
- `GET /api/ia/videos/:videoId/resultats` - Récupère les résultats
- `GET /api/ia/statistiques` - Statistiques d'analyse

### Routes de mise en correspondance

- `GET /api/ia/projets/:videoId/similaires` - Projets similaires
- `GET /api/ia/recommandations` - Recommandations personnalisées
- `GET /api/ia/projets/:videoId/collaborateurs` - Collaborateurs potentiels
- `GET /api/ia/projets/:id1/compatibilite/:id2` - Compatibilité entre projets

## Interface utilisateur

### Page IA (`/ia`)

La nouvelle page IA accessible via `/ia` propose :

1. **Onglet Recommandations** : Projets recommandés pour l'utilisateur
2. **Onglet Analyse** : Analyse des vidéos de l'utilisateur
3. **Onglet Statistiques** : Métriques d'utilisation de l'IA

### Intégration dans les pages existantes

- **Page vidéo** : Bouton "Analyse IA" pour voir les résultats
- **Dashboard** : Widget de recommandations
- **Upload** : Analyse automatique après upload

## Dépannage

### Problèmes courants

1. **Erreur "Module not found"**
   - Vérifier que toutes les dépendances sont installées
   - Exécuter `npm install` dans backend et frontend

2. **Erreur de base de données**
   - Vérifier que la migration a été appliquée
   - Vérifier la connexion à PostgreSQL

3. **APIs d'IA non disponibles**
   - Vérifier les clés API dans `.env`
   - Le mode fallback s'active automatiquement

### Logs de débogage

```bash
# Backend
cd backend
npm run dev

# Les logs montreront :
# 🤖 Nouvelles fonctionnalités IA disponibles sur /api/ia
```

## Performance et optimisation

### Recommandations

1. **Base de données**
   - Indexer les champs `analyse_ia_status` et `embedding_vector`
   - Considérer une base vectorielle pour de gros volumes

2. **Cache**
   - Mettre en cache les embeddings calculés
   - Cache Redis pour les recommandations fréquentes

3. **Traitement asynchrone**
   - L'analyse IA se fait en arrière-plan
   - Utiliser des queues pour de gros volumes

## Sécurité

### Bonnes pratiques

1. **Clés API**
   - Ne jamais exposer les clés côté client
   - Utiliser des variables d'environnement

2. **Validation**
   - Toutes les entrées sont validées
   - Limitation du taux de requêtes

3. **Permissions**
   - Seuls les utilisateurs authentifiés accèdent à l'IA
   - Chaque utilisateur ne voit que ses données

## Support et maintenance

### Monitoring

- Surveiller les appels API et leurs coûts
- Logs d'erreur pour les échecs d'analyse
- Métriques d'utilisation des fonctionnalités IA

### Évolutions futures

- Support de nouveaux formats vidéo
- Analyse multilingue
- Intégration de nouveaux modèles d'IA
- Fonctionnalités de collaboration avancées

## Contact

Pour toute question sur l'intégration, consultez :
- La documentation technique dans `/docs`
- Les tests dans `/backend/test-ia-simple.js`
- Les exemples d'utilisation dans les composants frontend

