---
title: 'Auto-évaluation à trois états (epic-boucle / story 1.3)'
type: 'feature'
ticket: '3'
created: '2026-10-30'
status: 'in-progress'
baseline_revision: 'c65214f7c6de0fa25c3bfd8fa31ba3b658a05646'
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

**Problem:** après révélation, rien ne distingue su/douteux/à revoir : le bouton jetable « Suivante » avance sans voter, le nombre de passes sues n'existe pas, et ni le clavier desktop (1/2/3, espace/Entrée) ni les annonces lecteurs d'écran ne sont branchés — la boucle R1 « vote à trois états + compteur de sues » manque.

**Approach:** les votes se stockent dans l'état local durable `ReviewState` (un record par passe, AD-1) ; la barre d'auto-évaluation (À revoir / Hésité / Su, trois pilules de 44 px qui n'apparaissent qu'après révélation, DESIGN.md:144) fait avancer immédiatement sans confirmation ; « Passer » avance sans voter (la passe reste dans la file) ; le compteur de passes sues s'affiche sur l'en-tête de Réviser et se met à jour à chaque vote sans animation (EXPERIENCE.md:66) ; desktop : espace/Entrée révèle, 1/2/3 votent (EXPERIENCE.md:112) ; révélation et vote annoncés aux lecteurs d'écran (EXPERIENCE.md:121) ; le bouton « Suivante » de la story 1 cède.

</frozen-after-approval>

## Implementation Notes

- Route oneshot : ~90 lignes nettes sur 3 fichiers, prolongement direct du schéma d'état existant (vote = une nouvelle clef et un record), aucune structure nouvelle.
- 2026-10-30 — Implémentation : `contexts/ReviewContext.tsx` — `votes` (record id→état) dans `ReviewState`, rétrocompatibilité au chargement (`votes: {}` quand absent), `voter(vote)` enregistre puis avance sans confirmation, `avancer` reste « Passer » (sans vote), compteur `sues` dérivé des votes. `app/(tabs)/revise.tsx` — compteur « N passe(s) sues » sous l'en-tête de file. `app/session-revision.tsx` — barre d'auto-évaluation post-révélation (À revoir / Hésité / Su, pilules 44 px), bouton « Suivante » retiré remplacé par « Passer » (post-révélation seulement), clavier desktop (espace/Entrée révèle, 1/2/3 votent), région d'annonce `accessibilityLiveRegion` + helper `annoncer` (announceForAccessibility sur natif, EXPERIENCE.md:121).
- 2026-10-30 — Apostrophe non échappée dans `'C'est fini…'` (template literal coupé, cascade d'erreurs TS1005/TS1434) : corrigé avec l'échappement `\'` (précédent existant dans GifPlayer).
- 2026-10-30 — Patches de revue (quick pass, 10 trouvailles) : compteur de sues rendu aussi dans la branche vide/finie de Réviser (disparaissait à l'instant clé du dernier vote) ; annonce du « Passer » branchée ; région d'annonce ajoutée à l'écran de fin (annonce du dernier vote précédemment perdue) ; helper natif `announceForAccessibility` ; libellés d'accessibilité alignés sur le plancher EXPÉRIENCE:120 (« Marquer {nom} comme… », « Passer {nom} ») ; pilules sur le token surface-raised #333333 du `rating-button` (bordure accent décorative retirée, DESIGN.md:103/161) ; garde de bornes dans `voter` (votes jamais sous la clef `undefined`, index de longueur permise par le clamp).
- 2026-10-30 — Semantics assumé : `sues` compte les votes « Su » de l'état local (aucune période) — cohérent avec l'usage d'un jour, la story 1.4 (composition J+1) arbitrera le périmètre de période à la reconsommation des votes.

## Review Triage Log

- Pass 1 (lentille quick, 2026-10-30) — 10 trouvailles : high 1, medium 3, low 3, false 1, defer 2.

- F1 Le compteur de sues disparaît dès que `termine`/file vide (branch `vide` de Réviser). Verdict **high** — l'AC du plan est violée au moment exact où il faut la voir. **Patch** : suesTexte rendu dans les deux branches.
- F2 « Passer » jamais annoncé aux lecteurs d'écran. Verdict **medium** (EXPERIENCE.md:121). **Patch** : helper `annoncer` branché sur le bouton.
- F3 Annonce du dernier vote perdue : la région d'annonce n'existe pas sur l'écran de fin (early return). Verdict **medium**. **Patch** : région rendue aussi sur la branche fin.
- F4 Aucune annonce native (iOS), `accessibilityLiveRegion` = Android/web seulement. Verdict **medium** (plancher EXPERIENCE.md:121, AD-8 natif révision hors ligne quand même vivant). **Patch** : `AccessibilityInfo.announceForAccessibility` sur non-web.
- F5 Libellés d'accessibilité hors vocabulaire du plancher (EXPERIENCE.md:120). Verdict **low**. **Patch** : « Marquer {nom} comme… » / « Passer {nom} ».
- F6 Pilules hors token `rating-button` : fill #1A1A1A + bordure accent décorative au lieu de surface-raised #333333. Verdict **low** (DESIGN.md:55-59, 103, 161). **Patch** : token appliqué, bordure retirée.
- F7 `.env.production`, `worker/.dev.vars`, sqlite miniflare dans le diff. Verdict **false** : hors change-set de la story, exclus volontairement du commit (staging nominatif, même décision qu'en 1.2).
- F8 `CORS_ORIGIN` du `.env.production` sans origine frontend réelle. Verdict réel **médium**, préexistant à la story, fichier sensible. **Defer** → deferred-work.md.
- F9 `voter` peut enregistrer sous l'id `undefined` (carteIndex == length permise par le clamp, guard absent). Verdict **low** (rejoignable par état corrompu du stockage). **Patch** : garde de bornes dans voter.
- F10 Écran de fin sans le nombre de passes vues (EXPERIENCE.md:86). Verdict **low**, possédé explicitement par la story 1.4. **Defer** → deferred-work.md (cross-check).

## Verification

**Commands:**
- `npx tsc --noEmit` (racine) — expected: aucune erreur NOUVELLE vs baseline 12 erreurs / 4 fichiers préexistants (Section.tsx, gifCache.ts, worker auth/lists) ; décompte inchangé.

**Manual checks (dev local, app web, utilisateur):**
- Révélation puis trois votes : À revoir / Hésité / Su déroulent les trois états, chaque vote avance aussitôt, sans confirmation.
- Le compteur de passes sues sur Réviser suit chaque vote « Su », sans animation.
- « Passer » avance sans voter ni modifier le compteur.
- Desktop : espace/Entrée révèlent, 1/2/3 votent.
- Rechargement : les votes et le compteur survivent.
- Vétérans lecteurs d'écran : révélation et vote annoncés.