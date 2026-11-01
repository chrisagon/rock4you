---
title: 'Créneau de révision 4 h (matin/soir transports) (epic-boucle / story 1.7)'
type: 'feature'
ticket: '7'
created: '2026-10-30'
status: 'built'
baseline_revision: '8ab8812f5c9b59ecbe45c322b1f421bbbe8efb4b'
route: 'oneshot'
route_source: 'auto'
risk: 'medium'
review: ''
review_source: ''
lenses_ran: []
review_loop_iteration: 0
context: ['{project-root}/DocumentationR4Y/initiative-rock4me/ux-phase-1/EXPERIENCE.md', '{project-root}/DocumentationR4Y/initiative-rock4me/ux-phase-1/DESIGN.md']
---

<frozen-after-approval reason="human-owned intent — do not modifier unless human renegotiates">

## Intent

**Problem:** la fin de session verrouille la révision jusqu'au lendemain — l'utilisateur veut réviser **matin et soir dans les transports** : 4 h de délai entre deux créneaux, pas 24.

**Approach:** à la fin d'une session, l'heure (locale, AD-1) est figée ; la file du créneau suivant se recompose au chargement dès que 4 h se sont écoulées depuis la fin de la dernière session (plus le changement de calendrier) — mêmes règles de composition (ratées/hésitées du créneau écoulé en tête, puis jamais vues, cap 12, sans geste jamais, exclusions à vie). Wording : « C'est fini pour cette session. » en fin de session, et Réviser affiche « Rien à revoir pour l'instant — prochaine révision vers HH:MM » tant que le créneau n'est pas écoulé. Les états stockés déjà terminés (sans l'horodatage) redeviennent révisables immédiatement.

</frozen-after-approval>

## Implementation Notes

- Route oneshot : ~30 lignes nettes sur 3 fichiers ; le mécanisme de composition (composerFile, 1.4) est réutilisé identiquement, seul le déclencheur change (intervalle vs calendrier).
- 2026-10-30 — Implémentation : `contexts/ReviewContext.tsx` — `finDerniereSession` posée à chaque transition `termine` (vote, passer, exclusion finale) ; déclencheur `creneauEcoule` = termine + 4 h écoulées **ou** session ouverte dont le lancement date de plus de 4 h (un créneau abandonné expire aussi) ; état terminé sans horodatage (états d'avant) dû immédiatement ; `prochaineRevision` exposé ; `rattraperCreneau()` branché sur `visibilitychange` (web) / `AppState` (natif) + un intervalle 30 s pour l'onglet qui traverse l'échéance sans re-focus. `app/(tabs)/revise.tsx` — la phrase gelée exacte « Rien à revoir pour l'instant — prochaine révision vers HH:MM » (affichée seulement tant que l'échéance est future), compteur sues + Réviser librement conservés. `app/session-revision.tsx` — « C'est fini pour cette session. » (écran + annonces).
- 2026-10-30 — Patches de revue (quick pass, 3 trouvailles) : l'abandon d'une session ouverte expire désormais au créneau aussi (les passes non atteintes retournent au vivier, elles ne sont pas en vues) ; rattrapage du boundary sans remontage (visibilitychange/AppState/intervalle) + heure jamais affichée dans le passé ; wording conforme à l'intent gelé (une phrase, em-dash).

## Review Triage Log

- Pass 1 (lentille quick, 2026-10-30) — 3 trouvailles : médium 3.

- F1 La clause « plus le changement de calendrier » : une session abandonnée en cours (`termine: false`) restait stale à jamais (le loader ne consultait plus le calendrier). Verdict **médium** — réel pour le pattern transports, et l'intent gelé était ambigu de mon fait. **Patch** : le créneau expire aussi pour les sessions ouvertes (4 h depuis `dernierLancement`) ; les passes non atteintes retournent au vivier (jamais en vues).
- F2 Le boundary est sourd au remontage : provider monté une fois, aucune observation de l'écoulement — Réviser verrouillée avec une heure passée. Verdict **médium** — le scénario cœur de la story (natif revenant du fond). **Patch** : `rattraperCreneau()` + visibilitychange/AppState + intervalle 30 s ; l'heure ne s'affiche plus une fois passée.
- F3 Wording de l'état vide déviant de la phrase gelée (deux chaînes, majuscule, points). Verdict **médium** (bloc gelé, mon propre écart). **Patch** : la phrase unique exacte.

## Verification

**Commands:**
- `npx tsc --noEmit` (racine) — expected: aucune erreur NOUVELLE vs baseline 12 erreurs / 4 fichiers préexistants.

**Manual checks (dev local, utilisateur):**
- Session finie : « C'est fini pour cette session. » + passes vues ; Réviser affiche « prochaine révision vers HH:MM ».
- Triche du stockage (`finDerniereSession` reculé de 4 h) puis recharge : la file se recompose, votes du créneau écoulé en tête, re-votable sans attendre le lendemain.
- Le state stocké d'avant (termine sans horodatage) est réouvrable immédiatement.