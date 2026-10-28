---
tracker_id: ""
type: epic
title: "Boucle de rappel"
parent: initiative-rock4me
covers: ["R1", "R6"]
sources: [DocumentationR4Y/initiative-rock4me/initiative-rock4me.md]
companions: [DocumentationR4Y/initiative-rock4me/ux-phase-1/EXPERIENCE.md, DocumentationR4Y/initiative-rock4me/ux-phase-1/DESIGN.md, DocumentationR4Y/initiative-rock4me/architecture-phase-1/architecture-phase-1.md]
after: []
refined: false
risk: medium
---

# Boucle de rappel

## Description

La file du jour vit sur l'app déployée : le nom s'affiche, le geste reste caché jusqu'au tap, le vote à trois états avance sans confirmation, la file se termine par un état explicite et se reconstitue le lendemain depuis l'état local durable. Le correctif média minimal livre la porte média unique (`utils/gifCache.ts`, AD-7) que les épics suivants réutilisent : la révélation est le point de téléchargement, jamais avant.

## Outcome

Pour Christophe : une révision qui expose ses manques et s'achève, avec chaque geste téléchargé une seule fois par navigateur (signal du parent, section Done when).

## Done when

- Un jour de révision se termine par « C'est fini pour aujourd'hui » et le nombre de passes sues est consultable, sur l'app déployée.
- Les votes survivent au redémarrage de l'app ; la file du lendemain reprend les ratées d'hier.
- Une passe révélée n'est téléchargée qu'une fois par navigateur (vérifié dans les outils du web) ; en navigation, rien ne se télécharge avant la révélation.
- Les 29 passes sans geste n'apparaissent jamais dans la file.
- Intégration: la Pages déployée joue une session complète en conditions réelles.

## Boundaries

- L'affichage de famille en révision est porté par la carte R1 de cet épic ; la complétion des données et les filtres du catalogue appartiennent à epic-familles.
- L'ordre des passes et l'enchaînement appartiennent à epic-enchaînement ; cette boucle ne touche pas `PassesSauvegardes`.
- Aucun état serveur de révision : l'état reste local (AD-1).
- Touch point: UI client — les écrans Réviser et Session ; owner: epic-boucle
- Touch point: porte média `utils/gifCache.ts` — owner: epic-boucle
- Touch point: catalogue embarqué en lecture seule — owner: epic-boucle (aucune écriture, AD-1)
- Must not change: le catalogue et la recherche instantanée.

## References

- parent — DocumentationR4Y/initiative-rock4me/initiative-rock4me.md, section Requirements (R1, R6)
- design — DocumentationR4Y/initiative-rock4me/ux-phase-1/EXPERIENCE.md, §Component Patterns (Carte de révision, Révélation, auto-évaluation), §State Patterns, §Key Flows 1 et 4
- design — DocumentationR4Y/initiative-rock4me/ux-phase-1/DESIGN.md, Composants Carte de révision, Barre d'auto-évaluation
- architecture — DocumentationR4Y/initiative-rock4me/architecture-phase-1/architecture-phase-1.md, sections AD-1, AD-4, AD-7