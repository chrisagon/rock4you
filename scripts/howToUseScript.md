# 🚀 Comment utiliser le script d'extraction Google Data

## 📋 Étapes détaillées

### **1. Ouvrir les outils de développement**
1. **Ouvrez votre Google Sheets** : https://docs.google.com/spreadsheets/d/1gJ9qirGXrNsB0afyVkD80_l9obiNKFzJbXtHyk22sWo/edit
2. **Appuyez sur F12** (ou clic droit > "Inspecter l'élément")
3. **Cliquez sur l'onglet "Console"** dans les outils de développement

### **2. Exécuter le script**
1. **Ouvrez le fichier** `scripts/extractGoogleData.js` dans votre éditeur
2. **Sélectionnez tout le contenu** (Ctrl+A)
3. **Copiez** (Ctrl+C)
4. **Collez dans la console** du navigateur
5. **Appuyez sur Entrée**

### **3. Méthodes d'extraction**

#### **Méthode A : Export CSV (Recommandée)**
```javascript
// 1. Dans Google Sheets : Fichier > Télécharger > CSV
// 2. Ouvrez le fichier CSV dans un éditeur de texte
// 3. Copiez le contenu et utilisez :
const csvContent = `votre,contenu,csv,ici...`;
const moves = processCsvData(csvContent);
console.log(moves); // Vos données formatées !
```

#### **Méthode B : Copie directe**
```javascript
// 1. Sélectionnez les données dans Google Sheets (A1:R[dernière ligne])
// 2. Copiez et pour chaque ligne :
const move = convertCsvLineToDanceMove("ligne,csv,ici", 0);
console.log(move);
```

### **4. Récupérer les résultats**
1. **Les données formatées** s'affichent dans la console
2. **Clic droit** sur le résultat > "Copy object"
3. **Collez** dans votre fichier `data/danceMoves.ts`

## 🎯 Exemple pratique

```javascript
// Exemple avec une ligne de votre fichier :
const ligneCsv = "Cours débutant 1,1,Passe de base,X,1,Bases,,,,,Position fermée,Position fermée,4 temps,Sur place,Mouvement fondamental,,passe_base.gif,https://drive.google.com/file/d/1ABC123/view";

const passe = convertCsvLineToDanceMove(ligneCsv, 0);
console.log(passe);
// Résultat : objet DanceMove formaté !
```

## ⚠️ Problèmes courants

### **Console vide ou erreur**
- Vérifiez que vous êtes sur la bonne page Google Sheets
- Actualisez la page et réessayez
- Vérifiez que JavaScript est activé

### **Données manquantes**
- Assurez-vous d'avoir sélectionné toutes les colonnes A à R
- Vérifiez que les permissions Google Drive sont correctes

### **Format incorrect**
- Respectez exactement la structure CSV
- Échappez les guillemets dans les textes

## 🎉 Une fois terminé

Vous aurez un tableau d'objets JavaScript prêt à intégrer dans votre application !