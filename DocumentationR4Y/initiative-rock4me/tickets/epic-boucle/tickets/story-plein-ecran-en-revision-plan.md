---
title: 'Plein écran en révision (epic-boucle / story 1.6)'
type: 'feature'
ticket: '6'
created: '2026-10-30'
status: done
baseline_revision: '45c5d433df046a8bbfe5ce968b2be7d226338082'
route: 'oneshot'
route_source: 'auto'
risk: 'low'
review: 'quick'
review_source: 'pinned'
lenses_ran: ['quick']
review_loop_iteration: 0
context: ['{project-root}/DocumentationR4Y/initiative-rock4me/ux-phase-1/EXPERIENCE.md', '{project-root}/DocumentationR4Y/initiative-rock4me/ux-phase-1/DESIGN.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** le geste révélé de la session de révision tient dans un cadre 560×315 max — impossible de l'agrandir là où les autres écrans le permettent déjà.

**Approach:** après révélation, un bouton plein écran (cible 44 px, icône Maximize) ouvre la modale plein écran existante (`FullScreenImageModal`, déjà routée par la porte média `utils/gifCache.ts` depuis la story 1.2 : aucun `?t=`, cache effectif) sur la passe en cours, geste en boucle ; fermeture par croix ou tap extérieur ; libellés français tutoiement ; retour sur la même carte sans rien perdre de la session.

</frozen-after-approval>

## Implementation Notes

- Route oneshot : ~25 lignes sur 2 fichiers, la modale et sa porte existent déjà.
- 2026-10-30 — Implémentation : `app/session-revision.tsx` — bouton « Plein écran » (pilule 44 px, icône Maximize) après révélation ; modale `FullScreenImageModal` (déjà routée par la porte média de la story 1.2).
- 2026-10-30 — Patches de revue (quick pass, 3 trouvailles) : le plein écran est lié à **l'id de la passe** (`pleinEcranId`) et la visibilité est dérivée (`pleinEcranId === moveCourante.id`) — une exclusion ou un vote clavier referme la modale au même rendu sans jamais afficher le geste d'une passe pas encore révélée (EXPERIENCE.md:67/:111) ; la lecture de la carte se suspend pendant le plein écran (`isPlaying={!pleinEcranActif}`) — une seule lecture en cours (AD-7). L'effet de fermeture indexé sur `carteIndex` est retiré (dérivation suffisante).

## Review Triage Log

- Pass 1 (lentille quick, 2026-10-30) — 3 trouvailles : medium 2, false 1.

- F1 Secrets/CORS/dns/sqlite dans le diff-fichier. Verdict **false** : hors change-set, staging nominatif, exclusions volontaires (même décision que 1.2/1.3/1.4).
- F2 Modale liée à `carteIndex` uniquement : exclusion de la passe affichée ou vote clavier pendant la modale → le geste d'une autre passe, jamais révélé, s'affichait plein écran. Verdict **médium** (casse EXPERIENCE.md:67/:111). **Patch** : plein écran lié à l'id de la passe, visibilité dérivée, fermeture au même rendu.
- F3 Deux lectures simultanées du même geste (carte + modale) pendant le plein écran. Verdict **médium** (AD-7 « une seule lecture en cours », DESIGN). **Patch** : `isPlaying` de la carte suspendu pendant le plein écran.

## Verification

**Commands:**
- `npx tsc --noEmit` (racine) — expected: aucune erreur NOUVELLE vs baseline 12 erreurs / 4 fichiers préexistants.

**Manual checks (dev local, app web, utilisateur):**
- Session : après révélation, le bouton plein écran ouvre le geste agrandi en boucle.
- Fermeture (croix ou tap extérieur) : retour sur la même carte, progression intacte.
- Lecture par la porte : requête sans `?t=`, seconde ouverture sans re-téléchargement.