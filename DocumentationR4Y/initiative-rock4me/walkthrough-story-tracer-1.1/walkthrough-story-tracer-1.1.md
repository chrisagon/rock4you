# Walkthrough story 1.1 — b402047

**Target:** commit `b402047` — "feat(Rock4me): story 1.1 tracer - file du jour vivante (local durable, revision tab+session, AD-1)"

**Ticket :** plan [story-tracer-file-du-jour-vivante-plan.md](../tickets/epic-boucle/tickets/story-tracer-file-du-jour-vivante-plan.md) · epic [epic-boucle.md](../tickets/epic-boucle/epic-boucle.md)

## [ ] Intent — in-progress — CURRENT block

**Problem:** l'application montre le catalogue mais rien n'aide à mémoriser : pas de file du jour, pas de session de révision ; la story 1.1 ouvre la voie la plus fine à travers toutes les couches de l'épic (état local durable → file dérivée → onglet Réviser → session révélée).

**Approach:** un `ReviewContext` local-durable (motif des contexts existants, persisté via AsyncStorage), un onglet Réviser en première position avec l'en-tête de file, une session plein écran hors onglets où le geste se révèle au tap via `GifPlayer`, un bouton d'avance jetable fait progresser la file, un état de fin minimal.

*Source : frontmatter gelé du plan [story-tracer-file-du-jour-vivante-plan.md](../../tickets/epic-boucle/tickets/story-tracer-file-du-jour-vivante-plan.md), approuvé par l'utilisateur au checkpoint 1.*