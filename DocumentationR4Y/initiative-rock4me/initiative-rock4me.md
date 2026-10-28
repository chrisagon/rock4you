---
tracker_id: ""
type: initiative
title: "Rock4me — l'entraîneur de passes : mémoriser en jouant"
parent: none
sources: [DocumentationR4Y/initiative-rock4me/brief-memorisation-des-passes/brief-memorisation-des-passes.md, DocumentationR4Y/initiative-rock4me/brief-memorisation-des-passes/addendum.md]
companions: [DocumentationR4Y/initiative-rock4me/ux-phase-1/EXPERIENCE.md, DocumentationR4Y/initiative-rock4me/ux-phase-1/DESIGN.md, DocumentationR4Y/initiative-rock4me/architecture-phase-1/architecture-phase-1.md]
after: []
risk: medium
---

# Rock4me — l'entraîneur de passes : mémoriser en jouant

## Description

Rock4me transforme le catalogue de 244 passes (215 jouables) en entraîneur personnel : la boucle de rappel révèle ce qui n'est pas su, les familles donnent l'indice de récupération, l'enchaînement joue une liste d'un bout à l'autre pour préparer une chorégraphie, et Cloudflare Access retire la plomberie du compte. Quand c'est fait, un utilisateur unique révisant une file du jour finissable, joue ses listes en séquence et ajoute une passe à une liste sans jamais voir un écran de compte ; le poids des médias reste inchangé, assumé en wifi. Exigences dérivées du brief produit et de son addendum ; le comportement détaillé vit dans les compagnons adoptés (spines UX phase 1).

## Outcome

Pour Christophe, utilisateur unique du catalogue : passer d'un défilement qui entretient l'illusion à un outil qui accroît le nombre de passes réellement sues — signal du brief §Critères de succès : « sur quatre semaines, le nombre de passes sues augmente sans que le temps de révision n'explose ».

## Requirements

1. **Boucle de rappel** (R1, brief §La solution A, §Critères de succès)
   La file du jour est plafonnée, se révèle carte par carte (geste masqué puis révélé sur tap), se vote à trois états (à revoir / hésité / su) et se termine par un état explicite « C'est fini pour aujourd'hui » ; le nombre de passes sues est consultable. Les passes sans geste ne sont jamais proposées.
2. **Indice de famille** (R2, brief §La solution B, §Critères de succès)
   Chaque passe porte une famille (ou « non classée » assumée) et un niveau, visibles dans le catalogue et en révision ; les filtres famille et niveau ramènent la passe visée. Toutes les passes ont une famille ou une famille « non classée » explicitement assumée.
3. **Accès sans compte** (R3, brief §La solution C)
   Cloudflare Access authentifie avant l'application ; aucun écran de connexion, d'inscription ni de réinitialisation n'existe dans le produit ; un utilisateur authentifié retrouve ses listes et ses favoris.
4. **Enchaînement d'une liste** (R4, brief §La solution E, §Critères de succès)
   Depuis une liste, un appui sur « Enchaîner » la joue de bout en bout après un seul lancement : boucles fixes par passe [HYPOTHÈSE : paramètre ajustable], pause et pas-à-pas, écran de fin avec Rejouer ou retour ; une passe sans geste est sautée avec une mention, jamais bloquante ; le réordonnancement des passes dans la liste fixe l'ordre de danse et persiste.
5. **Correctifs mobiles bloquants** (R5, brief §Périmètre, addendum §4)
   Sur les écrans principaux : cibles tactiles d'au moins 44 px, safe areas respectées, grille des favoris virtualisée.
6. **Cache web des médias** (R6, brief §Critères de succès, §La solution D)
   Une passe révélée n'est téléchargée qu'une fois par navigateur puis servie par le cache ; le geste ne se charge qu'à la révélation, jamais avant pendant la navigation.

## Constraints

1. **Poids intact en phase 1** (C1, brief §La solution D, §Risques) : aucun traitement média (pas de dérivation, pas de domaine R2) ; révision et enchaînement en wifi assumés — un enchaînement de cinq passes charge environ 84 Mo (addendum §1).
2. **Rappels reportés** (C2, brief §Périmètre) : pas d'ordonnancement espacé (SRS), pas d'historique ni de statistiques, pas de partage public, pas de notifications ; les états de révision restent stockés localement.
3. **Compte et médias** (C3, brief §La solution C, addendum §3) : le schéma multi-utilisateurs reste en base sans fonction de partage ; les GIF restent les seuls masters en phase 1, seul le client corrige son cache.

## Done when

- Un jour de révision se termine par « C'est fini pour aujourd'hui » et le nombre de passes sues du jour est consultable.
- Une liste se joue de bout en bout après « Enchaîner », jusqu'à l'écran de fin, sans nouvelle action nécessaire ; le réordonnancement tient à la réouverture.
- Une passe révélée n'est re-téléchargée qu'une fois par navigateur, vérifié dans les outils du web.
- Un utilisateur authentifié par Access ouvre directement ses écrans ; aucun écran d'authentification ne se trouve dans l'app.
- [HYPOTHÈSE mesurable] sur une session de dix minutes, trois passes de plus réellement disponibles ; sur quatre semaines, le nombre de passes sues augmente sans que le temps de révision n'explose.

## Boundaries

- Hors phase 1 : le pipeline média (archivage, dérivation MP4/WebM, domaine R2) est l'étape suivante ; SRS, historique et statistiques, partage public et liens, notifications, vue de dos/miroir/ralenti, recherche par position ou type ; renommage des listes et réordonnancement des listes elles-mêmes.
- Touch point : client Expo (Catalogue, Favoris, Réviser, enchaînement) — sans épic encore, attaché au slicing.
- Touch point : Worker + D1 (listes, rang des passes, persistance du réordonnancement) — sans épic ; la colonne de rang se tranche à l'architecture.
- Touch point : Cloudflare Access (OTP) et le déploiement Pages — sans épic.
- Tracer path : une passe trouvée au Catalogue va dans une liste de Favoris, l'enchaînement la joue de bout en bout, la boucle de rappel la teste le lendemain — sans jamais montrer d'écran de compte.
- Must not change : le catalogue embarqué et la recherche instantanée (déjà bien construits, brief §État actuel).

## References

- brief — DocumentationR4Y/initiative-rock4me/brief-memorisation-des-passes/brief-memorisation-des-passes.md, §La solution A–E, §Critères de succès, §Périmètre, §Risques
- addendum — DocumentationR4Y/initiative-rock4me/brief-memorisation-des-passes/addendum.md, §1 mesures média, §2 preuves, §3 options, §4 dette
- design — DocumentationR4Y/initiative-rock4me/ux-phase-1/EXPERIENCE.md (adopté), §Component Patterns et §State Patterns (enchaînement, réordonnancement, voix)
- design — DocumentationR4Y/initiative-rock4me/ux-phase-1/DESIGN.md (adopté), jetons et composants
- architecture — DocumentationR4Y/initiative-rock4me/architecture-phase-1/architecture-phase-1.md (adopté, final 2026-10-28), AD-1 à AD-8

## Notes

- Assumption: deux boucles par passe dans l'enchaînement, paramètre ajustable (ux-phase-1 §State Patterns).
- Assumption: la surface authentifiée de phase 1 est le web (Pages + Access) ; le natif reste hors périmètre d'authentification, catalogue + révision hors ligne seulement (architecture AD-8, 2026-10-28).
- Decision: le découpage en 5 épics est approuvé le 2026-10-28 (boucle, familles, enchaînement, Access, correctifs) ; l'hypothèse d'ordre du brief est confirmée.
- Decision: R6 (porte média, cache, révélation-seule) voyage dans l'épic boucle — la révélation est le point de téléchargement, et l'AD-7 livre la porte aux épics suivants ; alternatives déclinées : R6 dans l'épic enchaînement, R6 dans l'épic correctifs, `after` supplémentaires pour les épics familles/correctifs (collisions réglées par les descriptions).
- Decision: la dette des listes (plafond à 10, N+1) entre dans l'épic enchaînement, dans la story propriétaire du contrat de lecture (2026-10-28).
- Decision: l'enchaînement et le réordonnancement des passes dans une liste entrent en phase 1 à la demande de l'utilisateur (2026-10-28, memlog du brief).
- Decision: l'interdiction d'autoplay vaut pour la navigation ; l'enchaînement est un acte explicite lancé d'un tap (2026-10-28, memlog ux-phase-1).
- Decision: la persistance du réordonnancement passe par une colonne `rank` sur `PassesSauvegardes` et un seul appel batch idempotent à « Terminer » — architecture AD-2 (2026-10-28).
- Decision: l'architecture phase 1 rafraîchie porte l'enchaînement (AD-2/AD-3), la porte média unique (AD-7), le cutover Access (AD-5/AD-6) et la surface web-first (AD-8) ; le provisionnement à première connexion est la règle d'identité par défaut (architecture, 2026-10-28).