---
tracker_id: ""
type: epic
title: "Surfaces au standard"
parent: initiative-rock4me
covers: ["R5"]
sources: [DocumentationR4Y/initiative-rock4me/initiative-rock4me.md]
companions: [DocumentationR4Y/initiative-rock4me/ux-phase-1/EXPERIENCE.md, DocumentationR4Y/initiative-rock4me/ux-phase-1/DESIGN.md, DocumentationR4Y/initiative-rock4me/architecture-phase-1/architecture-phase-1.md]
after: []
refined: false
risk: low
---

# Surfaces au standard

## Description

Sur l'app déployée, les écrans principaux du web passent la barre tactile de la spine : cibles de 44 px minimum (dont le bouton GIF de 24 px, cœur et plein écran sans hitSlop, addendum §4), safe areas respectées en haut et en bas, grille des favoris virtualisée. R5 seulement : la porte média vit dans epic-boucle.

## Outcome

Pour Christophe : une interface qui ne manque pas une cible et ne coupe pas son contenu, sur le mobile qu'il utilise vraiment.

## Done when

- Aucune cible interactive sous 44 px sur les écrans principaux (audit des composants listés en addendum §4), sur l'app déployée.
- La grille des favoris est virtualisée (FlatList active, l'imbriquement ScrollView retiré).
- Les safe areas de haut et de bas ne recouvrent aucun contenu, y compris sur la barre d'onglets.
- Intégration: la Pages déployée passe une vérification des touches et du défilement sur les écrans Catalogue, Favoris, Réviser.

## Boundaries

- Ce sont les écrans consolidés par les épics 1 à 3 : l'ordre de build passe cet épic en dernier ; aucun changement de comportement porté par ces écrans (AD-8 : web d'abord).
- Le web reste la cible de vérification ; les écrans natifs héritent des mêmes composants sans travail propre.
- Touch point: UI client — écrans principaux, carte, actions de carte — owner: epic-correctifs
- Must not change: le comportement établi (boucle, listes, enchaînement).

## References

- parent — DocumentationR4Y/initiative-rock4me/initiative-rock4me.md, section Requirements (R5)
- design — DocumentationR4Y/initiative-rock4me/ux-phase-1/EXPERIENCE.md, §Accessibility Floor (44 px, libellés), §Responsive & Platform
- architecture — DocumentationR4Y/initiative-rock4me/architecture-phase-1/architecture-phase-1.md, Deferred (native), conventions