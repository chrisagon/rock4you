---
tracker_id: ""
type: epic
title: "Familles comme indice"
parent: initiative-rock4me
covers: ["R2"]
sources: [DocumentationR4Y/initiative-rock4me/initiative-rock4me.md]
companions: [DocumentationR4Y/initiative-rock4me/ux-phase-1/EXPERIENCE.md, DocumentationR4Y/initiative-rock4me/ux-phase-1/DESIGN.md, DocumentationR4Y/initiative-rock4me/architecture-phase-1/architecture-phase-1.md]
after: []
refined: false
risk: medium
---

# Familles comme indice

## Description

Toutes les passes portent une famille (ou « non classée » assumée) et un niveau, visibles dans le catalogue et filtrables ; l'indice de famille devient le signal de récupération du catalogue. La complétion des 219 familles relève du jugement humain : une partie du travail est `hitl`.

## Outcome

Pour Christophe : trouver une passe par la famille entendue en cours, sans lire les 244.

## Done when

- Toutes les passes ont une famille ou une famille « non classée » explicitement assumée, sur l'app déployée.
- Les filtres famille et niveau ramènent la passe visée depuis la feuille de filtres.
- Les niveaux affichés correspondent aux données (l'axe incohérent interface 1–5 / données 1–2 est assumé ou corrigé).
- Intégration: la Pages déployée liste et filtre avec les familles définitives.

## Boundaries

- L'affichage de famille sur la carte de révision est porté par epic-boucle (carte R1).
- Le catalogue reste embarqué et immuable à l'exécution : la complétion se fait source (`data/danceMoves.ts` + CSV), jamais via l'API (conventions Data).
- Touch point: données du catalogue (complétion familles) — owner: epic-familles
- Touch point: feuille de filtres du catalogue — owner: epic-familles
- Must not change: la recherche instantanée et la structure des listes.

## References

- parent — DocumentationR4Y/initiative-rock4me/initiative-rock4me.md, section Requirements (R2)
- design — DocumentationR4Y/initiative-rock4me/ux-phase-1/EXPERIENCE.md, §Component Patterns (Feuille de filtres, Carte de passe), §State Patterns (Passe sans geste, Aucun résultat)
- architecture — DocumentationR4Y/initiative-rock4me/architecture-phase-1/architecture-phase-1.md, conventions Data & formats, Deferred (données familles)