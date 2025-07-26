# 🚀 Configuration Cloudflare R2 pour Rock4you.mobile

## 📋 Étapes de configuration

### 1. Créer le bucket R2

1. **Connectez-vous** à votre tableau de bord Cloudflare
2. **Naviguez** vers R2 Object Storage dans le menu latéral
3. **Cliquez** sur "Create bucket"
4. **Nommez** votre bucket : `rock4you-gifs`
5. **Sélectionnez** une région proche de vos utilisateurs

### 2. Configurer les permissions CORS

1. **Ouvrez** votre bucket `rock4you-gifs`
2. **Allez** dans l'onglet "Settings"
3. **Trouvez** la section "CORS policy"
4. **Cliquez** sur "Add CORS policy" ou "Edit"
5. **Ajoutez** la configuration CORS suivante :

```json
[
  {
    "AllowedOrigins": [
      "*"
    ],
    "AllowedMethods": [
      "GET",
      "HEAD"
    ],
    "AllowedHeaders": [
      "*"
    ],
    "ExposeHeaders": [
      "ETag",
      "Content-Length",
      "Content-Type"
    ],
    "MaxAgeSeconds": 3600
  }
]
```

### 3. Activer l'accès public

1. **Dans les paramètres du bucket**, trouvez "Public access"
2. **Activez** "Allow public read access"
3. **Confirmez** l'activation

### 4. Configurer un domaine personnalisé (Optionnel)

1. **Allez** dans l'onglet "Custom domains"
2. **Cliquez** sur "Connect domain"
3. **Entrez** votre domaine : `gifs.rock4you.com`
4. **Suivez** les instructions pour configurer les enregistrements DNS

### 5. Uploader vos GIFs

1. **Cliquez** sur "Upload files" dans votre bucket
2. **Sélectionnez** tous vos fichiers GIF
3. **Assurez-vous** que les noms correspondent exactement à ceux dans `gifFileName`
4. **Vérifiez** que chaque fichier est accessible publiquement

## 🔧 Configuration dans l'application

### Variables d'environnement à renseigner :

```env
# Obligatoire - Nom de votre bucket
EXPO_PUBLIC_CLOUDFLARE_R2_BUCKET_NAME=rock4you-gifs

# Obligatoire - ID de votre compte Cloudflare
EXPO_PUBLIC_CLOUDFLARE_R2_ACCOUNT_ID=votre-account-id-ici

# Optionnel - Domaine personnalisé si configuré
EXPO_PUBLIC_CLOUDFLARE_R2_CUSTOM_DOMAIN=gifs.rock4you.com
```

### Comment trouver votre Account ID :

1. **Connectez-vous** à Cloudflare
2. **Dans la barre latérale droite**, vous verrez "Account ID"
3. **Copiez** cette valeur (format : abc123def456...)

## 🧪 Test de la configuration

### 1. Test direct dans le navigateur

Ouvrez cette URL dans votre navigateur :
```
https://votre-account-id.r2.cloudflarestorage.com/rock4you-gifs/nom-de-votre-gif.gif
```

Ou avec domaine personnalisé :
```
https://gifs.rock4you.com/nom-de-votre-gif.gif
```

### 2. Test dans l'application

1. **Lancez** l'application : `npm run dev`
2. **Vérifiez** que les GIFs s'affichent sur l'écran d'accueil
3. **Testez** la recherche et les favoris

## ⚠️ Problèmes courants

### GIF ne s'affiche pas :
- ✅ Vérifiez que le fichier existe dans le bucket
- ✅ Confirmez que l'accès public est activé
- ✅ Testez l'URL directe dans le navigateur
- ✅ Vérifiez la configuration CORS

### Erreur CORS :
- ✅ Assurez-vous que la politique CORS est bien configurée
- ✅ Vérifiez que `AllowedOrigins` inclut `"*"` ou votre domaine spécifique
- ✅ Confirmez que `GET` est dans `AllowedMethods`

### Variables d'environnement :
- ✅ Redémarrez le serveur de développement après modification du `.env`
- ✅ Vérifiez que les variables commencent par `EXPO_PUBLIC_`
- ✅ Confirmez que l'Account ID est correct

## 💰 Coûts estimés

Cloudflare R2 est très économique :
- **Stockage** : $0.015 par GB/mois
- **Opérations** : $4.50 par million de requêtes
- **Pas de frais de sortie** (egress) contrairement à AWS S3

Pour une application avec ~100 GIFs (environ 50MB total) :
- Coût mensuel estimé : < $1

## 🔄 Migration depuis Google Drive

1. **Téléchargez** tous vos GIFs depuis Google Drive
2. **Organisez** les fichiers avec les bons noms
3. **Uploadez** en lot dans R2
4. **Testez** quelques URLs avant de déployer
5. **Mettez à jour** les variables d'environnement
6. **Redémarrez** l'application

## 📞 Support

Si vous rencontrez des difficultés :
1. **Vérifiez** la documentation officielle Cloudflare R2
2. **Testez** les URLs directement dans le navigateur
3. **Consultez** les logs de la console du navigateur pour les erreurs CORS