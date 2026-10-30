---
title: 'Porte média unique (R6) (epic-boucle / story 1.2)'
type: 'feature'
ticket: '2'
created: '2026-10-30'
status: 'built'
baseline_revision: '2424d06c547a25bdd190371827ca9f41cb6581ec'
route: 'oneshot'
route_source: 'auto'
risk: 'medium'
review: 'quick'
review_source: 'pinned'
lenses_ran: ['quick']
review_loop_iteration: 0
context: ['{project-root}/DocumentationR4Y/initiative-rock4me/architecture-phase-1/architecture-phase-1.md', '{project-root}/DocumentationR4Y/initiative-rock4me/ux-phase-1/EXPERIENCE.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** chaque révélation/Rejouer d'un geste re-télécharge ~16,8 Mo : `GifPlayer` buste le cache (`?t=` à :206) à chaque lecture, `GifPlayer` et `FullScreenImageModal` lisent l'URL sans passer par la porte `utils/gifCache.ts` (second chemin, AD-7), l'éviction native ne tourne qu'à l'init (plafond contournable après écriture), et le libellé de chargement « Chargement du geste… » de la spine manque — R6 « une fois par navigateur » ne tient aujourd'hui nulle part.

**Approach:** retirer le cache-busting et router chaque lecture de geste (session, modal plein écran) à travers `cacheGif` — web : URL stable servie par le cache HTTP du navigateur ; natif : chemin fichier du cache — puis appliquer le plafond d'éviction existant après chaque téléchargement natif et ajouter le libellé de chargement exact de la spine. Si la vérification web montre un re-téléchargement devant l'absence de `Cache-Control` de `r2.dev`, activer un domaine de zone pour les GIF dans cette story (AD-4, opération Cloudflare côté utilisateur + régénération des URLs du catalogue).

</frozen-after-approval>

## Implementation Notes

- Route oneshot : ~40-50 lignes nettes sur 3-4 fichiers, aucune structure nouvelle ; ce contexte porte l'investigation complète (exploration + AD-4/AD-7).
- 2026-10-30 — Implémentation : `components/GifPlayer.tsx` — src résolu par `cacheGif` (porte AD-7) dans un état `resolvedSrc`, `?t=` retiré (URI stable), délai simulé de 300 ms remplacé par la résolution réelle, libellé spine « Chargement du geste… » en overlay plein cadre pendant `loading` (+ ligne Tentative si retry), branche « statut servi du sessionStorage » résout aussi le src par la porte. `utils/gifCache.ts` — `manageCacheSize()` appliqué après chaque téléchargement réussi (plafond existant à l'écriture, échec d'éviction non bloquant, AD-4/AD-7). `components/FullScreenImageModal.tsx` — lecture passée par la porte (résolution à l'ouverture en lecture, hooks déplacés avant le early-return). `hooks/useGifCache.ts` — paramètre `warmWhen` (défaut true), `isLoading` initial false, réchauffage strictement à la demande ; `components/CachedGif.tsx` — `warmWhen={isPlaying}` : le réchauffage natif au montage (navigation, AD-4) n'existe plus, il passe au premier play.
- 2026-10-30 — Décision locale : le réchauffage natif de CachedGif au montage était une violation AD-4/AD-7 « réchauffage jamais en navigation » ; ramené au premier `isPlaying` (le ticket porte littéralement « chargement du geste à la révélation seulement »). `reloadFromSource` reste l'action explicite de retry humain.
- 2026-10-30 — Baseline tsc à `2424d06` : 12 erreurs / 4 fichiers (components/Section.tsx, utils/gifCache.ts, worker/src/middleware/auth.ts, worker/src/routes/lists.ts), dont les erreurs préexistantes documentées.
- 2026-10-30 — Patches de revue (quick pass, 9 trouvailles) : la porte du GifPlayer est passée en **paresseuse** — le src ne se résout plus au montage mais quand `loaded && isPlaying` (fin des téléchargements natifs en navigation, de la fuite du libellé dans les grilles et du « loaded » sans src sur le chemin sessionStorage) ; échelle de retry morte de `loadGif` supprimée (le seul chemin d'échec réel est `Image.onError`) et ligne « Tentative » retirée avec ; plafond du cache natif 100 → 512 Mo (`DEFAULT_CONFIG.maxSizeMB`) pour tenir une session de 12 passes (AD-4 « natif garanti ») ; correction de la note ci-dessus : le src natif se résout à la lecture, pas à la validation.
- 2026-10-30 — Repli zone-domaine (AD-4) : si la vérification web le déclenche, `validateGifUrl` de GifPlayer (regex `pub-…r2.dev` dur) exige une mise à jour en même temps que les URLs du catalogue — sinon le porte se scinde. Documenté, conditionnel.
- 2026-10-30 — Deferred : landing `app/index.tsx:42-45` hors porte (différé dans deferred-work.md) ; `.env.production`, `worker/.dev.vars`, sqlite miniflare exclus du commit de la story (fichiers sensibles/runtime, staging nominatif — décidés avant la story).

## Review Triage Log

- Pass 1 (lentille quick, 2026-10-30) — 9 trouvailles : high 1, medium 1, low 3, false 1, regroupées 3 (même cause racine).

- P1 `components/GifPlayer.tsx:90` — téléchargements natifs au montage des grilles (loadGif → cacheGif → downloadAsync pour chaque carte visible). Verdict **high** : réel, violait AD-4/AD-7. **Patch** : porte passée en paresseuse (`loaded && isPlaying`), src résolu à la lecture seulement.
- P2 « Vérification web seulement » — couvert par le même patch (la dérivation native est ajoutée aux checks). Regroupé avec P1.
- P3 Overlay « Chargement du geste… » + désactivation qui fuient dans les grilles. Verdict réel **médium**, même cause racine que P1. **Patch** : overlay borné au chargement du geste (révélation/play), `disabled` reste limité à `status === 'loading'`.
- P4 Échelle de retry de `loadGif` morte (cacheGif ne rejette jamais ; échecs réels via `Image.onError`). Verdict **low** (préexistant, confirmé). **Patch** : échelle supprimée, ligne « Tentative » retirée avec ; la note d'implémentation corrigée.
- P5 « loaded » déclaré avant résolution du src (chemin sessionStorage, aucun feedback pendant un téléchargement natif évincé). Verdict réel **médium**, même cause racine que P1. **Patch** : la condition d'overlay couvre `loaded && isPlaying && !resolvedSrc`.
- P6 Plafond 100 Mo < session 12 × ~16,8 ≈ 202 Mo → re-téléchargement au Rejouer, casse AD-4 « natif garanti ». Verdict **médium**. **Patch** : `maxSizeMB` 100 → 512 (la politique d'éviction native se fixe dans cette story, AD-7).
- P7 Regex `validateGifUrl` bloque le repli zone-domaine. Verdict **low**, latent (contingence). **Note** dans Implementation Notes, pas de code tant que la vérification web n'a pas déclenché le repli.
- P8 Landing app/index.tsx charge un gif hors porte. Verdict **low**, préexistant. **Defer** → deferred-work.md.
- P9 `.env.production`, `worker/.dev.vars`, sqlite miniflare dans le diff. Verdict **false** : hors change-set de la story, exclus volontairement du commit (fichiers sensibles/runtime, staging nominatif décidé en amont).

## Verification

**Commands:**
- `npx tsc --noEmit` (racine) — expected: aucune erreur NOUVELLE vs baseline ~14 préexistantes (AGENTS.md) ; comparer le décompte.

**Manual checks (dev local, expo + navigateur, onglet Réseau):**
- Révélation 1 : le GIF se télécharge une fois, l'URL ne porte aucun paramètre `?t=`.
- Révélation 2 / Rejouer du même geste : aucune nouvelle requête (servie du cache).
- Navigation catalogue/favoris/recherche (web) : aucune requête GIF avant révélation.
- Si la révélation 2 retélécharge : lire les en-têtes de réponse de `r2.dev` — absence de `Cache-Control` exploitable → déclencher le repli AD-4 (domaine de zone) dans cette story, avec accord de l'utilisateur pour l'opération Cloudflare.
- Natif : dérivation du code — la porte ne tourne qu'à `loaded && isPlaying` (révélation/play), jamais au montage des grilles ; l'éviction s'applique après chaque écriture sous le plafond de 512 Mo. Aucun périphérique natif requis pour cette story (surface phase 1 = web, AD-8).