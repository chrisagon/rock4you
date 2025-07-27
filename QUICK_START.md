# 🚀 Démarrage Rapide - Rock4you

## ⚠️ Problème Actuel
L'erreur `TypeError: Failed to fetch` indique que l'API backend n'est pas démarrée.

## ✅ Solution en 3 Étapes

### 1. Démarrer l'API Backend
```bash
# Ouvrir un terminal et aller dans le dossier worker
cd worker

# Migrer la base de données (première fois seulement)
node scripts/migrate.js --local

# Démarrer l'API
npm run dev
```

**Vous devriez voir :**
```
✅ Worker local démarré sur http://localhost:8787
```

### 2. Tester l'API
```bash
# Dans un autre terminal, tester l'API
curl http://localhost:8787/health
```

**Réponse attendue :**
```json
{"status":"ok","timestamp":"2025-01-27T..."}
```

### 3. Démarrer l'Application
```bash
# Dans un troisième terminal (à la racine du projet)
npm run dev
```

## 🎯 Test d'Inscription

1. **Ouvrir l'application** dans votre navigateur
2. **Aller sur "S'inscrire"**
3. **Remplir le formulaire :**
   - Nom d'utilisateur : `testuser` (3+ caractères)
   - Email : `test@example.com`
   - Mot de passe : `TestPassword123!` (8+ caractères)
   - Confirmer le mot de passe : `TestPassword123!`
4. **Cliquer sur "S'inscrire"**
5. **Vous devriez être redirigé vers la page d'accueil**

## 🔍 Vérification des Logs

**Ouvrir les outils de développement (F12) et vérifier la console :**

### ✅ Logs de succès :
```
🔍 Vérification du statut d'authentification...
ℹ️  Utilisateur non authentifié (erreur réseau ou API non disponible)
🔄 Tentative d'inscription... {username: "testuser", email: "test@example.com"}
🔄 AuthContext: Appel API register...
🌐 API Request: {url: "http://localhost:8787/api/auth/register", method: "POST"}
📡 Envoi de la requête vers: http://localhost:8787/api/auth/register
📨 Réponse reçue: {status: 201, statusText: "Created", ok: true}
✅ AuthContext: Inscription réussie, utilisateur: {...}
✅ Inscription réussie, redirection...
```

## 🐛 Si ça ne marche toujours pas

### Vérifier que l'API fonctionne :
```bash
# Test manuel de l'inscription
curl -X POST http://localhost:8787/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser2","email":"test2@example.com","password":"TestPassword123!"}'
```

### Réinitialiser complètement :
```bash
# Arrêter tous les processus (Ctrl+C)

# Réinitialiser la base de données
cd worker
node scripts/migrate.js --local --reset

# Redémarrer l'API
npm run dev

# Dans un autre terminal, redémarrer l'app
cd ..
npm run dev
```

## 📋 Checklist de Vérification

- [ ] ✅ API backend démarrée (`cd worker && npm run dev`)
- [ ] ✅ API accessible (`curl http://localhost:8787/health`)
- [ ] ✅ Base de données migrée (`node scripts/migrate.js --local`)
- [ ] ✅ Application démarrée (`npm run dev`)
- [ ] ✅ Fichier `.env.local` existe avec `EXPO_PUBLIC_API_URL=http://localhost:8787`

## 🎉 Résultat Attendu

Après inscription réussie, vous devriez :
1. Voir les logs de succès dans la console
2. Être automatiquement redirigé vers la page d'accueil avec les onglets
3. Pouvoir naviguer entre les onglets "Favoris" et "Profil"
4. Voir vos informations utilisateur dans l'onglet "Profil"

---

**Note :** L'erreur `Failed to fetch` au démarrage est normale si l'API n'est pas encore démarrée. Elle disparaîtra une fois l'API lancée.