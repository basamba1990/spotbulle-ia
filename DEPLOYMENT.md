# 🚀 Guide de Déploiement SpotBulle

## ✅ Corrections Effectuées

### Problème résolu :
- **Erreur** : `Cannot find module '../middlewares/authMiddleware'`
- **Cause** : Le dossier était nommé `middleware` au lieu de `middlewares`
- **Solution** : Correction des imports dans tous les fichiers de routes

## 🔧 Déploiement Backend sur Render

### 1. Préparation du Repository
```bash
# Votre code est prêt avec les corrections
git add .
git commit -m "Fix middleware imports for production"
git push origin main
```

### 2. Configuration Render
1. Connectez-vous à [render.com](https://render.com)
2. Cliquez "New +" → "Web Service"
3. Connectez votre repository GitHub
4. Configuration :
   - **Name** : `spotbulle-backend`
   - **Environment** : `Node`
   - **Build Command** : `cd backend && npm install`
   - **Start Command** : `cd backend && npm start`
   - **Plan** : Free

### 3. Variables d'Environnement Render
```env
NODE_ENV=production
PORT=10000
DATABASE_URL=[Auto-généré par Render PostgreSQL]
JWT_SECRET=[Générer une clé secrète forte]
SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_ANON_KEY=votre_clé_anon
SUPABASE_SERVICE_ROLE_KEY=votre_clé_service
```

### 4. Base de Données PostgreSQL
1. Dans Render Dashboard → "New +" → "PostgreSQL"
2. Nom : `spotbulle-db`
3. Plan : Free
4. Copiez l'URL de connexion dans `DATABASE_URL`

## 🌐 Déploiement Frontend sur Vercel

### 1. Configuration Vercel
1. Connectez-vous à [vercel.com](https://vercel.com)
2. "New Project" → Importez votre repository
3. Configuration :
   - **Framework Preset** : Next.js
   - **Root Directory** : `frontend`
   - **Build Command** : `npm run build`
   - **Output Directory** : `.next`

### 2. Variables d'Environnement Vercel
```env
NEXT_PUBLIC_API_URL=https://spotbulle-backend.onrender.com
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_clé_anon
```

## 🔑 Configuration Supabase

### 1. Créer un Projet Supabase
1. [supabase.com](https://supabase.com) → "New Project"
2. Notez l'URL et les clés API

### 2. Configuration Storage
```sql
-- Créer un bucket pour les vidéos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('videos', 'videos', true);

-- Politique d'accès
CREATE POLICY "Public Access" ON storage.objects 
FOR SELECT USING (bucket_id = 'videos');

CREATE POLICY "Authenticated Upload" ON storage.objects 
FOR INSERT WITH CHECK (bucket_id = 'videos' AND auth.role() = 'authenticated');
```

## 🧪 Test Local

### Backend
```bash
cd backend
npm install
npm start
# Test : http://localhost:5000/api/health
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# Test : http://localhost:3000
```

## 📋 Checklist de Déploiement

### ✅ Backend (Render)
- [ ] Repository connecté
- [ ] Variables d'environnement configurées
- [ ] Base de données PostgreSQL créée
- [ ] Service déployé avec succès
- [ ] API accessible via HTTPS

### ✅ Frontend (Vercel)
- [ ] Repository connecté
- [ ] Variables d'environnement configurées
- [ ] Build réussi
- [ ] Site accessible via HTTPS
- [ ] Connexion API fonctionnelle

### ✅ Supabase
- [ ] Projet créé
- [ ] Bucket storage configuré
- [ ] Politiques d'accès définies
- [ ] Clés API copiées

## 🔧 Dépannage

### Erreurs Communes

**1. Module Not Found**
```bash
# Vérifier la structure des dossiers
ls -la backend/src/
# S'assurer que les chemins sont corrects
```

**2. Database Connection**
```bash
# Vérifier DATABASE_URL dans Render
echo $DATABASE_URL
```

**3. CORS Errors**
```javascript
// Vérifier la configuration CORS dans server.js
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000'
}));
```

## 🚀 URLs de Production

- **Backend API** : `https://spotbulle-backend.onrender.com`
- **Frontend** : `https://spotbulle.vercel.app`
- **Documentation API** : `https://spotbulle-backend.onrender.com/api/docs`

## 📞 Support

En cas de problème :
1. Vérifiez les logs Render/Vercel
2. Testez les endpoints API individuellement
3. Vérifiez les variables d'environnement
4. Consultez la documentation des services

