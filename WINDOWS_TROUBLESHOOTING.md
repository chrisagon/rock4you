# 🪟 Guide de Dépannage Windows - Rock4you

Ce guide résout les problèmes spécifiques à Windows lors du déploiement de Rock4you.

## 🚨 Problèmes Courants

### 1. Erreur `spawn npm ENOENT`

**Symptôme :**
```
Error: spawn npm ENOENT
    at ChildProcess._handle.onexit (node:internal/child_process:286:19)
```

**Cause :** Windows ne trouve pas la commande `npm` dans les scripts Node.js.

**Solutions :**

#### Solution A : Utiliser les scripts simplifiés (Recommandé)
```bash
# Au lieu de npm run deploy
npm run deploy:simple

# Au lieu de npm run deploy:prod
npm run deploy:prod-simple
```

#### Solution B : Installer npm globalement
```bash
# Vérifier l'installation de npm
npm --version

# Si npm n'est pas trouvé, réinstaller Node.js
# Télécharger depuis https://nodejs.org/
```

#### Solution C : Utiliser PowerShell ou CMD
```bash
# Ouvrir PowerShell en tant qu'administrateur
# Puis exécuter les commandes
```

### 2. Erreur de permissions

**Symptôme :**
```
Error: EACCES: permission denied
```

**Solutions :**
```bash
# Exécuter PowerShell en tant qu'administrateur
# Ou utiliser :
npm config set prefix %APPDATA%\npm
```

### 3. Problèmes avec curl

**Symptôme :** Les tests échouent car `curl` n'est pas disponible.

**Solution :** Les scripts simplifiés utilisent Node.js au lieu de curl.

### 4. Problèmes de chemins

**Symptôme :** Erreurs de chemins avec des barres obliques.

**Solution :** Utiliser les scripts simplifiés qui gèrent automatiquement les chemins Windows.

## 🛠️ Scripts Compatibles Windows

### Déploiement
```bash
# Script principal (peut avoir des problèmes sur Windows)
npm run deploy

# Script simplifié (recommandé pour Windows)
npm run deploy:simple
```

### Tests
```bash
# Tests backend uniquement
npm run test:backend

# Tests API (fonctionne sur Windows)
npm run test:api
```

### Migration de base de données
```bash
# Migration locale (fonctionne sur Windows)
npm run migrate:local

# Migration production (fonctionne sur Windows)
npm run migrate
```

## 🔧 Configuration Windows

### Variables d'environnement
```bash
# Créer .env.local
copy .env.example .env.local

# Éditer avec Notepad
notepad .env.local
```

### Installation des dépendances
```bash
# Dans le dossier principal
npm install

# Dans le dossier worker
cd worker
npm install
cd ..
```

## 🧪 Tests sur Windows

### Tests manuels recommandés
```bash
# 1. Tester la migration
npm run migrate:local

# 2. Tester l'API backend
cd worker
node scripts/test-api.js --local
cd ..

# 3. Déploiement simplifié
npm run deploy:simple
```

### Vérification manuelle
```bash
# Vérifier Wrangler
wrangler --version

# Vérifier l'authentification
wrangler whoami

# Tester la base de données
cd worker
wrangler d1 list
cd ..
```

## 🚀 Déploiement Étape par Étape (Windows)

### Étape 1 : Préparation
```bash
# Vérifier Node.js et npm
node --version
npm --version

# Installer Wrangler si nécessaire
npm install -g wrangler

# Se connecter à Cloudflare
wrangler auth login
```

### Étape 2 : Configuration
```bash
# Copier la configuration
copy .env.example .env.local

# Installer les dépendances
npm install
cd worker && npm install && cd ..
```

### Étape 3 : Migration
```bash
# Migrer la base de données
npm run migrate:local
npm run migrate
```

### Étape 4 : Déploiement
```bash
# Déploiement simplifié (recommandé)
npm run deploy:simple

# Ou déploiement production
npm run deploy:prod-simple
```

### Étape 5 : Vérification
```bash
# Tester l'API déployée
cd worker
node scripts/test-api.js --url=https://votre-api.workers.dev
cd ..

# Démarrer l'application
npm run dev
```

## 🐛 Dépannage Avancé

### Problème : Scripts qui ne s'exécutent pas
```bash
# Vérifier les permissions d'exécution
Get-ExecutionPolicy
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Problème : Wrangler ne fonctionne pas
```bash
# Réinstaller Wrangler
npm uninstall -g wrangler
npm install -g wrangler@latest

# Vérifier l'installation
wrangler --version
```

### Problème : Base de données inaccessible
```bash
# Vérifier la configuration
cd worker
type wrangler.toml

# Lister les bases de données
wrangler d1 list

# Tester une requête
wrangler d1 execute rock4you-db --command "SELECT 1"
```

## 📞 Support Windows

### Commandes de diagnostic
```bash
# Informations système
systeminfo | findstr /B /C:"OS Name" /C:"OS Version"

# Version Node.js
node --version
npm --version

# Version Wrangler
wrangler --version

# Test de connectivité
ping cloudflare.com
```

### Logs détaillés
```bash
# Activer les logs détaillés
set DEBUG=*
npm run deploy:simple

# Ou pour Wrangler
wrangler deploy --verbose
```

## ✅ Checklist Windows

- [ ] Node.js installé (version 18+)
- [ ] npm fonctionne (`npm --version`)
- [ ] Wrangler installé (`wrangler --version`)
- [ ] Authentifié sur Cloudflare (`wrangler whoami`)
- [ ] PowerShell ou CMD ouvert en tant qu'administrateur
- [ ] Variables d'environnement configurées
- [ ] Dépendances installées (`npm install`)
- [ ] Scripts simplifiés utilisés (`npm run deploy:simple`)

## 🎯 Recommandations Windows

1. **Utilisez toujours les scripts simplifiés** (`deploy:simple`, `deploy:prod-simple`)
2. **Exécutez PowerShell en tant qu'administrateur**
3. **Vérifiez les versions** de Node.js et npm régulièrement
4. **Utilisez des chemins absolus** si nécessaire
5. **Testez étape par étape** plutôt qu'en une fois

---

**Note :** Si vous continuez à avoir des problèmes, utilisez le déploiement manuel décrit dans le [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md).