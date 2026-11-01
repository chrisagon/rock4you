---
id: 3
type: bug
title: "Grille desktop de la recherche : 3 colonnes écrasées dans le conteneur filtre+résultats"
parent: none
covers: []
after: []
assignee: ""
refined: false
hitl: false
risk: low
severity: P2
---

# Grille desktop de la recherche : 3 colonnes écrasées dans le conteneur filtre+résultats

## Description

Sur la web desktop, la recherche affiche la sidebar de filtres à gauche et les résultats à droite ; dès que la fenêtre dépasse ~900 px, `ResponsiveGrid` rend **3 colonnes** dans un conteneur qui n'en a que pour **2** — la 3ᵉ colonne est coupée par le bloc filtre (rapport utilisateur 2026-11-01 : « le résultat s'affiche sur 3 colonnes au lieu de 2. La 3ème colonne est à moitié affichée à cause du décalage du bloc filtre »).

## Reproduction

- Environment : app web, fenêtre ≥ 900 px, écran Recherche (desktop branch).
- Steps : ouvrir Recherche, activer un filtre, observer la grille.
- Expected : 2 colonnes pleines à droite des filtres.
- Actual : 3 colonnes, la 3ᵉ rognée par la colonne filtres.

## Cause Hypothesis

`components/ResponsiveGrid.tsx:56-57` calcule `columns = getNumColumns(screen.width)` et `itemWidth` depuis la largeur **de la fenêtre** (`useScreen()`), jamais de son propre conteneur — alors que le branch desktop de `app/(tabs)/search.tsx:222-224` réduit le conteneur à ~75 % (sidebar filtres) et prévoit 2 colonnes (`:59-61`). Au-delà de 900 px de fenêtre, `getNumColumns` renvoie 3 (`ResponsiveGrid.tsx:33`) dans les 75 %. Le contrat du composant (en-tête du fichier : « Calcule dynamiquement le nombre de colonnes selon la largeur [du parent] ») dit la correction : mesurer la largeur réelle via `onLayout`, en déduire colonnes et itemWidth.

## Acceptance Criteria

1. **La grille respecte son conteneur**
   **Given** l'écran Recherche en desktop (fenêtre ≥ 900 px)
   **When** j'affiche les résultats, filtres actifs ou pas
   **Then** 2 colonnes complètes à droite de la colonne filtres, aucune colonne rognée
2. **Les autres grilles ne régressent pas**
   **Given** les écrans utilisant ResponsiveGrid (Recherche mobile, Favoris, Accueil)
   **When** ils se rendent à leur largeur normale
   **Then** leurs colonnes restent correctes (mesure du conteneur réel = plus précise que la fenêtre, jamais pire)
3. **Or: no change is needed, with proof**
   **Given** la reproduction
   **When** elle est rejouée sur le code courant
   **Then** le comportement attendu tient déjà — ceci supplante 1 et 2

## References

- parent — none (screens pré-épics ; hors épic-boucle touch points, « Must not change: le catalogue et la recherche instantanée » = fonctionnalités, un bug de layout ne touche pas le catalogue)
- code — `components/ResponsiveGrid.tsx:21-33, 55-57` (la mesure fenêtre), `app/(tabs)/search.tsx:222-224, 59-62, 390` (conteneur 75 %, 2 colonnes prévues)
- related — épic-boucle rétrospective (action items 4 : patterns à aligner)

## Notes

- Reporté 2026-11-01 par l'utilisateur pendant la vérification post-déploiement.