# 🚀 Guide de Déploiement - BeInEvent

## 📦 Architecture Docker

### Services
- **Backend** (NestJS) → Port 3001
- **Frontend** (Next.js) → Port 3000
- **MongoDB** → Port 27017

Tous les services communiquent via le réseau Docker `beinevent-network`.

---

## 🔧 Configuration des Variables d'Environnement

### Backend (.env)

**Développement:**
```env
MONGODB_URI=mongodb://mongodb:27017/beinevent
JWT_SECRET=your_super_secret_jwt_key_here_change_in_production
JWT_ACCESS_EXPIRES_IN=15m
NODE_ENV=development
PORT=3001
```

**Production:**
```env
MONGODB_URI=mongodb://mongodb:27017/beinevent
JWT_SECRET=<STRONG_RANDOM_SECRET_256_BITS>
JWT_ACCESS_EXPIRES_IN=15m
NODE_ENV=production
PORT=3001
```

### Frontend (.env.local)

**Développement:**
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

**Production:**
```env
NEXT_PUBLIC_API_URL=https://api.votre-domaine.com
```

---

## 🐳 Démarrage avec Docker

### 1. Cloner le projet
```bash
git clone <votre-repo>
cd BeInEvent
```

### 2. Configurer les variables d'environnement
```bash
# Backend
cp backend/.env.example backend/.env
# Modifier backend/.env avec vos valeurs

# Frontend (optionnel)
cp frontend/.env.example frontend/.env.local
```

### 3. Lancer tous les services
```bash
docker-compose up --build
```

### 4. Accéder aux services
- Frontend: http://localhost:3000
- Backend: http://localhost:3001
- MongoDB: localhost:27017

### 5. Arrêter les services
```bash
docker-compose down
```

### 6. Supprimer les volumes (reset DB)
```bash
docker-compose down -v
```

---

## 🔄 CI/CD avec GitHub Actions

### Pipeline Automatique

**Déclenchement:**
- ✅ Push sur `main` ou `develop`
- ✅ Pull Request vers `main` ou `develop`

**Jobs exécutés:**

#### 1. Backend CI
- Install dependencies (avec cache npm)
- Lint (ESLint)
- Tests (Jest)
- Build

#### 2. Frontend CI
- Install dependencies (avec cache npm)
- Lint (ESLint)
- Tests (Jest)
- Build

#### 3. Docker Build & Push (uniquement sur push main)
- Build images Docker
- Push vers Docker Hub
- Tags: `latest`

**La pipeline échoue si:**
- ❌ Lint échoue
- ❌ Tests échouent
- ❌ Build échoue

---

## 🔐 Configuration GitHub Secrets

Pour activer la publication Docker Hub, ajoutez ces secrets dans GitHub:

**Settings → Secrets and variables → Actions → New repository secret**

1. `DOCKERHUB_USERNAME` → Votre username Docker Hub
2. `DOCKERHUB_TOKEN` → Token d'accès Docker Hub

### Créer un Docker Hub Token:
1. Aller sur https://hub.docker.com
2. Account Settings → Security → New Access Token
3. Copier le token
4. L'ajouter dans GitHub Secrets

---

## 📊 Vérifier la Pipeline

### Voir les logs:
1. Aller sur GitHub → Actions
2. Cliquer sur le workflow
3. Voir les détails de chaque job

### Badge de statut (optionnel):
Ajouter dans README.md:
```markdown
![CI/CD](https://github.com/<username>/<repo>/workflows/CI%2FCD%20Pipeline/badge.svg)
```

---

## 🌐 Déploiement Production

### Option 1: VPS/Serveur
```bash
# Sur le serveur
git clone <repo>
cd BeInEvent
cp backend/.env.example backend/.env
# Configurer les variables de production
docker-compose up -d
```

### Option 2: Utiliser les images Docker Hub
```yaml
# docker-compose.prod.yml
services:
  backend:
    image: <username>/beinevent-backend:latest
    # ... reste de la config
  
  frontend:
    image: <username>/beinevent-frontend:latest
    # ... reste de la config
```

---

## 🧪 Tests Locaux

### Backend
```bash
cd backend
npm install
npm run test
npm run test:e2e
```

### Frontend
```bash
cd frontend
npm install
npm run test
```

---

## 📝 Checklist Déploiement

- [ ] `.env.example` créé et documenté
- [ ] Variables d'environnement configurées
- [ ] Docker Compose fonctionne localement
- [ ] GitHub Actions configuré
- [ ] Secrets Docker Hub ajoutés
- [ ] Pipeline passe (vert ✅)
- [ ] Images publiées sur Docker Hub

---

## 🆘 Troubleshooting

### Erreur: "Cannot connect to MongoDB"
```bash
# Vérifier que MongoDB est démarré
docker-compose ps
# Vérifier les logs
docker-compose logs mongodb
```

### Erreur: "Port already in use"
```bash
# Arrêter les services locaux
# Ou changer les ports dans docker-compose.yml
```

### Pipeline échoue sur tests
```bash
# Lancer les tests localement
npm run test
# Corriger les erreurs
```

---

## 📚 Ressources

- [Docker Documentation](https://docs.docker.com/)
- [GitHub Actions](https://docs.github.com/en/actions)
- [Docker Hub](https://hub.docker.com/)
