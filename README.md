# SpotBulle - Plateforme de partage vidéo

SpotBulle est une plateforme moderne de partage de vidéos d'événements qui permet aux utilisateurs de créer, partager et découvrir des moments uniques avec leur communauté.

## 🚀 Fonctionnalités

### MVP (Version 1.0)
- ✅ **Téléchargement de vidéos à distance** - Interface intuitive pour l'upload
- ✅ **Catégorisation par thématiques** - Système de tags et classification
- ✅ **Annuaire d'événements** - Répertoire organisé par événement
- ✅ **Authentification sécurisée** - Système de comptes utilisateurs
- ✅ **Tableau de bord personnel** - Gestion de ses vidéos et événements

### Fonctionnalités avancées (Roadmap)
- 🔄 **Intégration réseaux sociaux** - LinkedIn, Instagram, Facebook
- 🔄 **Transcription automatique** - Whisper API
- 🔄 **WebRTC** - Enregistrement direct
- 🔄 **Système de matching** - Connexions par centres d'intérêt

## 🛠 Architecture technique

### Backend
- **Framework**: Node.js avec Express.js
- **Base de données**: PostgreSQL avec Sequelize ORM
- **Authentification**: JWT (JSON Web Tokens)
- **Upload de fichiers**: Multer + Supabase Storage
- **Validation**: Express-validator
- **Sécurité**: Helmet, CORS, Rate limiting

### Frontend
- **Framework**: Next.js 14 avec App Router
- **UI**: React 18 + Tailwind CSS
- **Gestion d'état**: Context API + React Query
- **Upload**: React Dropzone
- **Authentification**: Context personnalisé

### Services externes
- **Stockage**: Supabase Storage
- **Base de données**: PostgreSQL (Supabase/Render)
- **Hébergement**: Vercel (frontend) + Render (backend)

## 📁 Structure du projet

```
spotbulle/
├── backend/
│   ├── src/
│   │   ├── config/          # Configuration DB
│   │   ├── controllers/     # Logique métier
│   │   ├── middlewares/     # Middlewares Express
│   │   ├── models/          # Modèles Sequelize
│   │   ├── routes/          # Routes API
│   │   └── server.js        # Point d'entrée
│   ├── .env                 # Variables d'environnement
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── app/             # Pages Next.js (App Router)
    │   ├── components/      # Composants React
    │   ├── context/         # Contextes React
    │   ├── lib/             # Utilitaires et API
    │   └── styles/          # Styles CSS
    ├── .env.local           # Variables d'environnement
    ├── next.config.js       # Configuration Next.js
    ├── tailwind.config.js   # Configuration Tailwind
    └── package.json
```

## 🚀 Installation et démarrage

### Prérequis
- Node.js 18+
- PostgreSQL
- Compte Supabase (pour le stockage)

### Backend

1. **Installation des dépendances**
```bash
cd backend
npm install
```

2. **Configuration de l'environnement**
```bash
cp .env.example .env
# Modifier les variables dans .env
```

3. **Variables d'environnement requises**
```env
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://username:password@localhost:5432/spotbulle
JWT_SECRET=your_super_secret_jwt_key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

4. **Démarrage du serveur**
```bash
npm run dev  # Mode développement
npm start    # Mode production
```

### Frontend

1. **Installation des dépendances**
```bash
cd frontend
npm install
```

2. **Configuration de l'environnement**
```bash
cp .env.local.example .env.local
# Modifier les variables dans .env.local
```

3. **Variables d'environnement requises**
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. **Démarrage de l'application**
```bash
npm run dev    # Mode développement
npm run build  # Build de production
npm start      # Serveur de production
```

## 📊 Base de données

### Modèles principaux

#### Users
- Gestion des utilisateurs avec authentification
- Profils personnalisables avec bio et avatar
- Système de préférences

#### Events
- Création et gestion d'événements
- Catégorisation par thématiques
- Géolocalisation et capacité

#### Videos
- Upload et métadonnées des vidéos
- Système de tags et catégories
- Paramètres de confidentialité

#### Participations
- Liaison utilisateurs-événements
- Gestion des rôles (organisateur, participant)
- Association avec les vidéos

## 🔐 Sécurité

- **Authentification JWT** avec expiration
- **Validation des données** côté serveur
- **Rate limiting** pour prévenir les abus
- **CORS** configuré pour les domaines autorisés
- **Helmet** pour les en-têtes de sécurité
- **Validation des fichiers** uploadés

## 📱 Responsive Design

- Interface adaptative mobile-first
- Composants optimisés pour tous les écrans
- Navigation tactile pour mobile
- Upload par glisser-déposer

## 🎨 Design System

- **Couleurs**: Palette cohérente avec variables CSS
- **Typographie**: Inter font pour la lisibilité
- **Composants**: Système modulaire réutilisable
- **Animations**: Transitions fluides avec Tailwind

## 🚀 Déploiement

### Production

1. **Backend (Render/Railway)**
```bash
# Variables d'environnement de production
NODE_ENV=production
DATABASE_URL=postgresql://...
JWT_SECRET=production_secret
```

2. **Frontend (Vercel)**
```bash
# Build automatique depuis Git
npm run build
```

3. **Base de données**
- Migration automatique en développement
- Scripts de migration pour la production

## 🧪 Tests

```bash
# Backend
cd backend
npm test

# Frontend
cd frontend
npm test
```

## 📈 Monitoring

- Logs structurés avec Morgan
- Gestion d'erreurs centralisée
- Métriques de performance
- Health checks

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 👥 Équipe

- **SpotBulle Team** - Développement initial

## 🆘 Support

Pour toute question ou problème :
- Ouvrir une issue sur GitHub
- Contacter l'équipe de développement
- Consulter la documentation

---

**SpotBulle** - Partagez vos moments, créez votre communauté 🎥✨

