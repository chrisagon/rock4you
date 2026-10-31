---
title: 'Composition et fin de file (epic-boucle / story 1.4)'
type: 'feature'
ticket: '4'
created: '2026-10-30'
status: done
baseline_revision: '062aa5d1ef565a44e215b722fb8c94a903c9dfff'
route: 'oneshot'
route_source: 'auto'
risk: 'medium'
review: 'quick'
review_source: 'pinned'
lenses_ran: ['quick']
review_loop_iteration: 0
context: ['{project-root}/DocumentationR4Y/initiative-rock4me/ux-phase-1/EXPERIENCE.md', '{project-root}/DocumentationR4Y/initiative-rock4me/ux-phase-1/DESIGN.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** la file ne vit qu'une fois : la reconstitution J+1 n'existe pas, une passe dont le geste est mort reste proposée pour toujours, la session se termine sans dire combien de passes ont été vues, et quand la file est vide l'utilisateur n'a aucune voie de révision.

**Approach:** la file du jour se rejoue du jour au lendemain : à un changement de jour, reprendre d'abord les ratées/hésitées de la veille (dans l'ordre du catalogue), puis complète à 12 avec des passes jamais vues [HYPOTHÈSE posée par la spine : EXPERIENCE.md:84] ; un ensemble de vues cumulé (jamais affiché — entrée de composition, pas une statistique) garantit « jamais vues » et retient les « Su » hors de la file à vie ; les 29 passes sans geste n'y entrent jamais ; à « Geste indisponible » (geste mort ou indisponible, EXPERIENCE.md:88) la passe sort de la file en séance, l'exclusion persiste et la file avance ; la session se termine par « C'est fini pour aujourd'hui. » avec le nombre de passes vues (EXPERIENCE.md:86) ; file vide → « Rien à revoir aujourd'hui. » + « Réviser librement » qui pioche dans tout le catalogue (EXPERIENCE.md:85).

</frozen-after-approval>

## Implementation Notes

- Route oneshot : ~95 lignes nettes sur 4 fichiers (composition = un filtre dérivé sur l'état existant, pas de structure nouvelle) ; stop-and-replan si la composition déborde.
- Décisions locales assumées : « vues » cumulé = mécanisme minimal de « jamais vues » (jamais affiché, hors contraintes C2 : pas de statistique ni d'historique affiché) ; passe « Passée » la veille = vue, non re-proposée au bucket jamais-vues (jugée non apprise implicitement, elle re-testera via le bucket ratées seulement si votée) — [HYPOTHÈSE] de composition assumée, révisable chez Sofia.
- 2026-10-30 — Implémentation : `contexts/ReviewContext.tsx` — `exclusions`, `vues` (cumul), `passesVues` dans ReviewState (rétrocompatibles) ; `composerFile(fileVeille, votes, exclusions, vues)` [ratées/hésitées de la veille d'abord, puis jamais vues, cap 12, sans geste jamais, exclusions bannies] ; changement de jour détecté au chargement (`dernierLancement` vs date du jour) → recomposition, index/zéro/fin remis à zéro ; `exclue(id)` retire la passe de la file (bannit à vie, dernière passe → fin de session) ; chaque passe **sortant de l'écran** (avancer/voter/exclure) entre dans `vues` et incrémente `passesVues` — jamais à la composition, pour que les passes non atteintes en cours de route restent proposables. `components/GifPlayer.tsx` — prop `onIndisponible` (une fois) : branchée sur l'échec réel d'image **après une recharge discrète unique en ligne et jamais hors ligne** (garde `navigator.onLine`, EXPÉRIENCE:90), et sur l'URL invalide. `app/session-revision.tsx` — branchement de l'exclusion + bannière visible « Geste indisponible. » (6 s) + annonces lecteurs d'écran ; écran de fin : nombre de passes vues. `app/(tabs)/revise.tsx` — « Réviser librement » (file vide) → catalogue complet `/search`.
- 2026-10-30 — Patches de revue (quick pass, 8 trouvailles) : échec transitoire ne bannit plus à vie (hors ligne = garde, en ligne = recharge unique puis déclaration) ; `vues` déplacé de la composition aux sorties d'écran (passes non atteintes re-proposables) ; sauvegarde à file vide acceptée (exclusions à vie préservées) ; `jamaisVues` exclut toute passe votée (les « Su » d'avant le cumul ne reviennent plus, `ratees`∩`jamaisVues` = ∅ plus de doublon) ; bannière visible « Geste indisponible. » + vocabulaire spine sur les overlays (« Gif indisponible »/« Pas de GIF » → « Geste indisponible », EXPÉRIENCE:18) ; signal d'indisponibilité sur la branche URL invalide.

## Review Triage Log

- Pass 1 (lentille quick, 2026-10-30) — 8 trouvailles : high 3, medium 2, low 1, false 2.

- F1 Échec réseau transitoire (hors ligne/flaky) → exclusion à vie via handleImageError. Verdict **high** — casse EXPÉRIENCE:90 (votes et file fonctionnent hors ligne) et le Flow 1 (voter sans geste). **Patch** : hors ligne = erreur sans exclusion ; en ligne = une recharge discrète (Image re-keyée) puis seulement là déclaration + exclusion ; `onLoad` remet la lecture.
- F2 `vues: [...nouvelleFile]` à la composition : passes non atteintes en cours de route condamnées (ni ratees sans vote, ni jamais vues). Verdict **high** — contredit la garantie « jamais vues » de l'intent figé. **Patch** : « vue » = passe sortant de l'écran (avancer/voter/exclure), composition ne touche plus `vues`.
- F3 Sauvegarde à `fileDuJour: []` (légitime après exclusions) rejetée par le garde `length > 0` → premier lancement réinitialise exclusions et votes : « bannie à vie » violée. Verdict **high**. **Patch** : garde sur `Array.isArray` seulement.
- F4 États legacy 1.3 (`vues` vide) : « Su » re-entrées + doublons (`ratees` ∩ `jamaisVues` ≠ ∅). Verdict **médium**. **Patch** : `jamaisVues` exclut toute passe votée (`votes[id] === undefined`).
- F5 « Geste indisponible. » jamais lisible (carte échangée au même moment) + overlays « Gif indisponible »/« Pas de GIF » hors vocabulaire EXPÉRIENCE:18. Verdict **médium**. **Patch** : bannière visible en session (6 s) + libellés alignés.
- F6 Branche URL invalide ne signale pas `onIndisponible`. Verdict **low** (latent : 215 URLs du catalogue validées à la main). **Patch** : signal unique branché.
- F7 secrets JWT tournés dans les fichiers exclus du diff / F8 sqlite miniflare généré. Verdict **false** : hors change-set de la story (staging nominatif, exclusions volontaires déjà décidées).

## Verification

**Commands:**
- `npx tsc --noEmit` (racine) — expected: aucune erreur NOUVELLE vs baseline 12 erreurs / 4 fichiers préexistants.

**Manual checks (dev local, app web, utilisateur):**
- Session finie : « C'est fini pour aujourd'hui. » porte le nombre de passes vues.
- Simulation d'un jour suivant (stockage local daté) : la file redémarre sur les ratées/hésitées de la veille, complétée à 12 avec des passes nouvelles, jamais de passe sans geste.
- Geste mort dans une session : « Geste indisponible », la passe sort de la file, ne revient plus les jours suivants.
- File vide : « Rien à revoir aujourd'hui. » + « Réviser librement » ouvre le catalogue complet.
- Votes et compteur de la story 1.3 continuent de fonctionner après recomposition.