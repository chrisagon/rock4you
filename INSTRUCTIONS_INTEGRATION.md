# 📋 Instructions pour intégrer vos données Google Drive

## 🎯 Objectif
Intégrer les vraies données de votre fichier Google Sheets avec les GIFs de Google Drive dans l'application Rock4you.mobile.

## 📊 Étape 1 : Extraction des données

### Option A : Export CSV (Recommandé)
1. **Ouvrez votre Google Sheets** : https://docs.google.com/spreadsheets/d/1gJ9qirGXrNsB0afyVkD80_l9obiNKFzJbXtHyk22sWo/edit
2. **Sélectionnez toutes les données** (A1:R[dernière ligne])
3. **Exportez** : Fichier > Télécharger > Valeurs séparées par des virgules (.csv)
4. **Utilisez le script** `scripts/extractGoogleData.js` pour traiter le CSV

### Option B : Copie manuelle
1. **Sélectionnez les données** dans Google Sheets
2. **Copiez** (Ctrl+C)
3. **Collez** dans un éditeur de texte
4. **Traitez ligne par ligne** selon le format dans `data/sampleDanceMoves.ts`

## 🔗 Étape 2 : Extraction des IDs Google Drive

Pour chaque lien dans la colonne R, extrayez l'ID :

### Formats de liens possibles :
- `https://drive.google.com/file/d/1ABC123XYZ/view` → ID : `1ABC123XYZ`
- `https://drive.google.com/open?id=1ABC123XYZ` → ID : `1ABC123XYZ`
- `https://drive.google.com/file/d/1ABC123XYZ/edit` → ID : `1ABC123XYZ`

### Script automatique :
```javascript
function extractGoogleDriveId(driveLink) {
  const patterns = [
    /\/file\/d\/([a-zA-Z0-9-_]+)/,
    /id=([a-zA-Z0-9-_]+)/,
    /\/d\/([a-zA-Z0-9-_]+)/
  ];
  
  for (const pattern of patterns) {
    const match = driveLink.match(pattern);
    if (match) return match[1];
  }
  return '';
}
```

## 🖼️ Étape 3 : Test des GIFs

### URL de test directe :
`https://drive.google.com/uc?export=view&id=VOTRE_ID`

### Vérification des permissions :
1. **Clic droit** sur chaque GIF dans Google Drive
2. **Partager** > **Modifier l'accès**
3. **Sélectionner** : "Tous les utilisateurs avec le lien peuvent consulter"

## 📝 Étape 4 : Mise à jour du code

### Dans `data/danceMoves.ts` :
```typescript
{
  id: 'move_1',
  courseName: 'COLONNE_A_DE_VOTRE_FICHIER',
  courseOrder: COLONNE_B_NUMERIQUE,
  movementName: 'COLONNE_C_NOM_MOUVEMENT',
  hasGif: COLONNE_D === 'X' || COLONNE_D === 'XX',
  difficulty: COLONNE_E_NUMERIQUE,
  family: 'COLONNE_F_FAMILLE',
  // ... autres colonnes
  gifFileName: 'COLONNE_Q_NOM_FICHIER',
  driveLink: 'COLONNE_R_LIEN_COMPLET',
  driveId: 'ID_EXTRAIT_DU_LIEN',
  // ... propriétés dérivées
}
```

## ✅ Étape 5 : Validation

### Tests à effectuer :
1. **Vérifiez** que les GIFs s'affichent dans l'application
2. **Testez** la recherche et les filtres
3. **Confirmez** que les favoris fonctionnent
4. **Validez** les informations affichées

### URLs de test :
- Application : http://localhost:8081 (ou votre port Expo)
- GIF direct : `https://drive.google.com/uc?export=view&id=VOTRE_ID`

## 🚨 Problèmes courants

### GIF ne s'affiche pas :
- ✅ Vérifiez les permissions Google Drive
- ✅ Testez l'URL directe dans le navigateur
- ✅ Confirmez que l'ID est correct

### Données manquantes :
- ✅ Vérifiez que la ligne n'est pas un cours (colonne C ne commence pas par "Cours")
- ✅ Confirmez que toutes les colonnes sont présentes
- ✅ Ignorez bien la colonne P (Timmy)

### Erreurs de format :
- ✅ Respectez la structure TypeScript
- ✅ Échappez les guillemets dans les textes
- ✅ Convertissez les nombres correctement

## 📞 Support

Si vous rencontrez des difficultés :
1. **Vérifiez** les exemples dans `data/sampleDanceMoves.ts`
2. **Utilisez** les fonctions utilitaires dans `utils/googleSheetsImporter.ts`
3. **Testez** étape par étape avec quelques passes d'abord

---

**Une fois l'intégration terminée, votre application Rock4you.mobile affichera tous vos GIFs de passes de danse avec les vraies données !** 🎉