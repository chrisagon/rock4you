---
tracker_id: ""
type: epic
title: "L'enchaînement d'une liste"
parent: initiative-rock4me
covers: ["R4"]
sources: [DocumentationR4Y/initiative-rock4me/initiative-rock4me.md]
companions: [DocumentationR4Y/initiative-rock4me/ux-phase-1/EXPERIENCE.md, DocumentationR4Y/initiative-rock4me/ux-phase-1/DESIGN.md, DocumentationR4Y/initiative-rock4me/architecture-phase-1/architecture-phase-1.md]
after: ["epic-boucle"]
refined: false
risk: medium
---

# L'enchaînement d'une liste

## Description

Sur l'app déployée, « Enchaîner » joue une liste de bout en bout : chaque geste tourne deux boucles [HYPOTHÈSE : paramètre ajustable], la passe suivante prend le relais sans transition, avec pause et pas-à-pas, fin + Rejouer ou retour ; les passes sans geste sont sautées avec mention. Le réordonnancement persiste : migration `rank` D1, un appel batch idempotent à « Terminer » (AD-2), le brouillon confiné à son écran (AD-3). La story du contrat de lecture règle aussi la dette des listes (plafond à 10, N+1) et publie la forme de réponse avant tout consommateur.

## Outcome

Pour Christophe : sa liste devient une chorégraphie jouable d'un appui, rejoueuse, dans un ordre qu'il fixe une fois pour toutes.

## Done when

- Une liste de six passes se joue de bout en bout après « Enchaîner », jusqu'à l'écran « Fin de l'enchaînement », sur l'app déployée.
- Le réordonnancement d'une liste tient à la réouverture et sur le Worker (rang réécrit 1..n, vérifié en D1).
- Une passe sans geste est sautée avec sa mention ; une URL morte ne bloque jamais.
- `GET /api/lists` rend toutes les listes (plafond 10 réglé) et le N+1 a disparu ; la forme de réponse est publiée.
- Intégration: la Pages déployée joue un enchaînement complet sur la vraie API.

## Boundaries

- La boucle de révision reste intouchée : aucun vote, aucune auto-évaluation ici.
- La porte média et le cache appartiennent à epic-boucle ; l'enchaînement ne crée aucun second chemin média (AD-7).
- L'authentification vit dans epic-acces ; tant que le cutover n'a pas eu lieu, cette épic ne prolonge pas la voie jeton (AD-6).
- Touch point: UI client — Favoris (bouton Enchaîner, mode Réordonner, écran d'enchaînement) — owner: epic-enchaînement
- Touch point: Worker + D1 — migration `rank`, point de terminaison d'ordre, contrat de lecture des listes (`routes/lists.ts`) — owner: epic-enchaînement
- Touch point: `services/api.ts` — lecture seule des listes, pas d'évolution auth — owner: epic-enchaînement
- Must not change: le comportement de la session de révision.

## References

- parent — DocumentationR4Y/initiative-rock4me/initiative-rock4me.md, section Requirements (R4)
- design — DocumentationR4Y/initiative-rock4me/ux-phase-1/EXPERIENCE.md, §IA (Écran d'enchaînement), §Component Patterns (Bouton Enchaîner, Carte d'enchaînement, Barre de lecture, Mode Réordonner), §State Patterns, §Key Flows 5
- design — DocumentationR4Y/initiative-rock4me/ux-phase-1/DESIGN.md, Composants chain-button, chain-card, chain-bar
- architecture — DocumentationR4Y/initiative-rock4me/architecture-phase-1/architecture-phase-1.md, sections AD-2, AD-3, AD-7