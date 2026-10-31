---
title: 'Refactor sweep (epic-boucle / story 1.5)'
type: 'refactor'
ticket: '5'
created: '2026-10-30'
status: 'built'
baseline_revision: '3c82ae60813480b77ae83b47f10ef981e00cc041'
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

**Problem:** les stories 1-6 ont laissé des restes : l'échelle de retry décimée de GifPlayer (8 références d'un `retryCount` figé à 0, texte statique « Tentatives: 1/3 » dans l'Alert) et le cadran de révélation hors token (fond `#000000` = surface-deep au lieu de surface-raised, bordure accent décorative hors table).

**Approach:** ménage seulement, zéro nouveau comportement : code mort retiré, écrans alignés sur les tables des spines (DESIGN.md reveal-button : raised `#333333` / ink-tertiary `#999999` / rounded.md 12 / 44 px), cibles et libellés d'accessibilité revérifiés ligne par ligne contre le plancher (EXPERIENCE.md:119-125).

</frozen-after-approval>

## Implementation Notes

- Route oneshot : ~20 lignes nettes (surtout des suppressions), 2 fichiers, mécanique.
- Lint : aucune config ESLint committée (`expo lint` interactif : installerait et écrirait une config — hors story) ; la vérification repose sur le typecheck + la revue, à documenter.
- 2026-10-30 — Implémentation : `components/GifPlayer.tsx` — machine de retry décimée retirée (champ `retryCount` de GifState, param de loadGif, tous reset à 0, ligne « Tentatives » de l'Alert ; les appelants historiques passaient tous un `0` figé, équivalence stricte). `app/session-revision.tsx` — cadran de révélation aligné sur le token reveal-button (surface-raised #333333, ink-tertiary #999999, rounded.md 12, 44 px, bordure accent décorative retirée).
- 2026-10-30 — Patches de revue (quick pass, 9 trouvailles) : conteneur GifPlayer aligné (ombre et bordure accent retirées — DESIGN « pas d'ombre, pas de bordure lumineuse » ; fond surface-deep gardé pour l'aire du geste, jeton de la table) ; cible des boutons de contrôle 24 → 44 px (plancher :119) ; textes d'overlay 8/10 → 12 px (typographie DESIGN « aucun texte en dessous de 12 px ») ; conteneur labellisé (plancher :120) avec prop honnête `a11yToggle` (session = inert : libellé d'état « Geste révélé de {nom} », catalogue = libellé d'action « Mettre/Reprendre {nom} ») ; preuve de non-comportement documentée ici + purge des diff-fichiers temporaires (contenaient des valeurs secrètes — le process de diff est désormais à périmètre de chemins).
- 2026-10-30 — Preuve de non-comportement : les seules modifications sont des champs morts (valeur figée 0), des styles (ombres/bordures/textes), et des libellés a11y ; les appelants (handleRetry, clearCache) recevaient tous retryCount=0 figé — aucune voie d'exécution change d'issue ; revérifiable par les checks manuels des stories 1-6.
- 2026-10-30 — Defers enregistrés : secret jumeau JWT (hygiène fichiers sensibles, hors story), dérive du baseline AGENTS.md (~14 → 12/4 mesuré).

## Review Triage Log

- Pass 1 (lentille quick, 2026-10-30) — 9 trouvailles : medium 2, false 3, defer 2, process 2.

- F1/F2/F5 Sensibles/CORS-API/sqlite dans le diff-fichier. Verdict **false** : hors change-set (staging nominatif) ; le CORS/API de `.env.production` est déjà déféré par la revue 1.3.
- F3 JWT_SECRET de `.dev.vars` = valeur tracée de `wrangler.toml`, jumeau maintenu. Verdict **médium**, préexistant, fichiers sensibles. **Defer** → deferred-work.md.
- F4 Le diff-fichier de review inlinait des secrets. Verdict réel — **mon process** : diff à périmètre de chemins désormais ; les 7 diff-fichiers temporaires (dont antérieures sessions) supprimés.
- F6 Trio off-token (fond deep, bordure, ombre elevation 5) survit dans le CONTENEUR de GifPlayer. Verdict **médium** — demi-alignement. **Patch** : ombre + bordure retirées (DESIGN), fond surface-deep gardé (jeton de table, aire du geste).
- F7 Plancher a11y violé dans le fichier touché : cible 24×24, conteneur sans libellé, textes 8/10 px. Verdict **médium** (plancher :119/:120, typographie DESIGN). **Patch** : 44 px, libellés honnêtes (prop a11yToggle), textes ≥ 12 px.
- F8 AGENTS.md basé ~14 vs réel 12/4. Verdict documentaire. **Defer** AGENTS.md (classification).
- F9 Preuve « aucun changement de comportement » non documentée. Verdict valide. **Patch** : argument d'équivalence documenté dans Implementation Notes.

## Verification

**Commands:**
- `npx tsc --noEmit` (racine) — expected: aucune erreur NOUVELLE vs baseline 12 erreurs / 4 fichiers préexistants ; décompte strictement inchangé.

**Manual checks:**
- Aucune modification de comportement sur les vérifications des stories 1-6 : révélation, votes, plein écran, indisponible, compteur — identiques.