# 🐛 Guide de Débogage - Problème d'Inscription

## 🎯 Problème Actuel
Le bouton "S'inscrire" ne fonctionne pas - l'utilisateur reste sur la page d'inscription.

## 🔍 Étapes de Débogage

### 1. Vérifier que l'API Backend est Démarrée

**Ouvrir un terminal et démarrer l'API :**
```bash
cd worker
npm run dev
```

**Vérifier que vous voyez :**
```
✅ Worker local démarré sur http://localhost:8787
```

### 2. Tester l'API Manuellement

**Dans un autre terminal, tester l'endpoint de santé :**
```bash
curl http://localhost:8787/health
```

**Réponse attendue :**
```json
{"status":"ok","timestamp":"..."}
```

### 3. Vérifier la Configuration Frontend

**Vérifier que le fichier `.env.local` existe :**
```bash
cat .env.local
```

**Contenu attendu :**
```
EXPO_PUBLIC_API_URL=http://localhost:8787
```

### 4. Démarrer l'Application avec Logs

**Dans un nouveau terminal :**
```bash
npm run dev
```

### 5. Tester l'Inscription avec Logs

1. **Ouvrir l'application** dans votre navigateur/émulateur
2. **Aller sur la page d'inscription**
3. **Ouvrir les outils de développement** (F12)
4. **Aller dans l'onglet Console**
5. **Remplir le formulaire d'inscription :**
   - Nom d'utilisateur : `testuser`
   - Email : `test@example.com`
   - Mot de passe : `TestPassword123!`
   - Confirmer le mot de passe : `TestPassword123!`
6. **Cliquer sur "S'inscrire"**
7. **Observer les logs dans la console**

## 📋 Logs Attendus

### Si tout fonctionne :
```
🔄 Tentative d'inscription... {username: "testuser", email: "test@example.com"}
🔄 AuthContext: Appel API register... {username: "testuser", email: "test@example.com"}
🌐 API Request: {url: "http://localhost:8787/api/auth/register", method: "POST", ...}
📡 Envoi de la requête vers: http://localhost:8787/api/auth/register
📨 Réponse reçue: {status: 201, statusText: "Created", ok: true}
📄 Données de la réponse: {success: true, message: "Inscription réussie", data: {...}}
📡 AuthContext: Réponse API reçue: {success: true, ...}
✅ AuthContext: Inscription réussie, utilisateur: {...}
✅ Inscription réussie, redirection...
```

### Si l'API n'est pas accessible :
```
🔄 Tentative d'inscription... {username: "testuser", email: "test@example.com"}
🔄 AuthContext: Appel API register... {username: "testuser", email: "test@example.com"}
🌐 API Request: {url: "http://localhost:8787/api/auth/register", method: "POST", ...}
📡 Envoi de la requête vers: http://localhost:8787/api/auth/register
❌ API Error: TypeError: Failed to fetch
❌ AuthContext: Erreur lors de l'inscription: TypeError: Failed to fetch
❌ Erreur inscription: TypeError: Failed to fetch
```

## 🛠️ Solutions par Type d'Erreur

### Erreur "Failed to fetch"
**Cause :** L'API backend n'est pas démarrée ou pas accessible
**Solution :**
```bash
cd worker
npm run dev
```

### Erreur "404 Not Found"
**Cause :** L'endpoint n'existe pas ou l'URL est incorrecte
**Solution :** Vérifier que l'URL dans `.env.local` est correcte

### Erreur "500 Internal Server Error"
**Cause :** Erreur dans l'API backend
**Solution :** Vérifier les logs du worker et la base de données

### Erreur de base de données
**Cause :** La base de données n'est pas migrée
**Solution :**
```bash
cd worker
node scripts/migrate.js --local
```

## 🔧 Commandes de Dépannage

### Réinitialiser complètement :
```bash
# Arrêter tous les processus
# Ctrl+C dans tous les terminaux

# Réinitialiser la base de données
cd worker
node scripts/migrate.js --local --reset

# Redémarrer l'API
npm run dev

# Dans un autre terminal, redémarrer l'app
cd ..
npm run dev
```

### Tester l'inscription via curl :
```bash
curl -X POST http://localhost:8787/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"TestPassword123!"}'
```

## 📞 Que Faire Ensuite

1. **Suivre les étapes ci-dessus dans l'ordre**
2. **Noter les logs exacts que vous voyez**
3. **Identifier à quelle étape ça échoue**
4. **Appliquer la solution correspondante**

Si le problème persiste, partagez les logs exacts de la console pour un diagnostic plus précis.