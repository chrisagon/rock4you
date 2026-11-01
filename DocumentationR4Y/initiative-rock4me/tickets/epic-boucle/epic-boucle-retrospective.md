---
epic: epic-boucle
date: 2026-10-30/11-01 (run du 30-10 au 01-11)
verdict: accepted-with-open-items
criteria: declared
headless: false
---

# Retrospective — epic-boucle (Boucle de rappel)

## Epic summary

- **Épic** : `epic-boucle` (Boucle de rappel, initiative rock4me) — voie 1→2→3→4→6→7→5, sweep dernier. **7/7 stories done** (complétude vérifiée par le ticket tree `tickets.toml` via `tickets.py status` ; le projet est en mode ticket-tree v7, sans `sprint-status.yaml` — la vérification par le script a donc été remplacée par cette source équivalente).
- **Diff range** : `19f8116..97cd7ef` (21 commits, +1890/−276, 40 fichiers uniques ; ranges par story dérivés des `baseline_revision` des plans, fin de la 1.7 déduite de HEAD).
- **Plans/story files** : 7 plans dans `tickets/epic-boucle/tickets/`, chacun avec frontmatter (`baseline_revision`, route, review, triage logs) ✅.
- **Session logs** : `.memlog.md` (épic initiative) + cette conversation — chaque story a son event daté ✅.
- **Sprint status** : absent (mode ticket-tree) — enregistré, pas de blocage.
- **Rétrospective précédente** : inexistante (première épic du projet) — pas de suivi d'actions antérieures.
- **Décisions de replan pendant l'épic** (source : memepic) : story 6 plein écran (demande utilisateur), story 7 créneau 4 h (demande utilisateur, remplace le cycle calendrier), sweep repositionné dernier et élargi à 1-7.

## Findings

### Agrégat — architecture
- **Checked-clean** : aucun renversement de layering, aucun cycle (imports des 6 fichiers cœur vérifiés : app → contexts/components → utils/data).
- `FullScreenImageModal` (composant partagé par 5 écrans pré-épics) a été re-câblé par la porte média — déviation acceptée (nécessaire à R6 ; source : `components/FullScreenImageModal.tsx:26-37`, story 1.2).
- Le durcissement auth worker (`worker/src/routes/auth.ts:108-120, 308-325`, commit `2424d06`) voyage dans ce diff sans être un livrable de l'épic — déviation acceptée (correctif pré-épic committé à la préparation de l'arbre, décision D1 ; documenté à son tour dans le plan du sweep).
- `ReviewProvider` monté global (`app/_layout.tsx:23`) — conforme au pattern existant.

### Agrégat — duplication (route : defer, prochaine épic)
- Résolution par la porte dupliquée : `GifPlayer.tsx:111-125` vs `FullScreenImageModal.tsx:26-37`.
- Clones GifPlayer ↔ CachedGif (sizeConfig, handleContainerPress, getImageSource, overlays : `GifPlayer.tsx:54-59, 237-252, 255-295, 349-372` vs `CachedGif.tsx:33-38, 51-60, 74-88, 91-124, 149-167`).
- Transitions d'état tripliquées dans `ReviewContext.tsx:238-287` (avancer/voter/exclue répètent vues + passesVues + ternaire de fin).
- Bloc d'attributs de cookie ×3 : `worker/src/routes/auth.ts:108-120, 198-210, 293-297`.
- Config R2 dupliquée : `utils/gifCache.ts:22-23` vs `config/cloudflare.ts:20`.

### Agrégat — taille
- `app/session-revision.tsx` (390 lignes, 148 de styles) : cohésif mais mélange déjà flux session, announceur a11y, clavier, exclusions, plein écran — à surveiller, pas un god-file.
- `contexts/ReviewContext.tsx` (320 lignes) : le module de fait des règles de composition (~91 lignes de loader/normalisation) — boundary clair, acceptable.

### Agrégat — divergence de pattern
- Identifiants français dans le client (avancer/voter/exclue/estCharge) vs l'anglais du contexte voisin (FavoritesContext) — déviation **acceptée** (convention produit : UI et état en français tutoiement, documentée au Notes de l'épic).
- 4 `catch` silencieux ajoutés (`GifPlayer.tsx:121`, `FullScreenImageModal.tsx:31`, `GifPlayer.tsx:143-145`, `gifCache.ts:69-71`) vs `console.warn` de ReviewContext — defer (petit nettoyage).
- Effect clavier sans tableau de deps (`session-revision.tsx:61-86`) — divergent de la discipline repo, fonctionnel — defer.
- Prop `a11yToggle` booléen à usage unique — defer (les épics suivants s'aligneront).

### Réconciliation spec ↔ construit
- R1 construite conforme (cap 12 `ReviewContext.tsx:9`, révélation puis vote, état de fin explicite, compteur sues visible, filtre sans-geste `:51-52`).
- **Wording non réconcilié** : le corps des Requirements/done-when dit encore « C'est fini pour aujourd'hui » et « file du lendemain » (`epic-boucle.md:27,33`) alors que la Decision du Notes (:58) et le construit (story 7) sont en créneau 4 h — **à réconcilier chez Sofia (proposé, Phase 4 item 5)**.
- `sues` = cumul toutes époques (`ReviewContext.tsx:290`) — accepté (story 1.3, note documentée) ; pas de vue par créneau.
- `passesVues` compte une passe réellement jamais affichée (geste mort avant affichage, `ReviewContext.tsx:284`) — accepté avec note.
- R2 côté déployé dépendait de l'env var — **trouvé par cette rétro** (voir Findings — livrable/fix-now, ci-dessous).

### Trouvailles — coutures inter-stories (lentille d'épic)
- **[HIGH] Passe « Passée » perdue à jamais** : une passe sortie de l'écran via « Passer » entre dans `vues` et sans vote — elle ne peut entrer dans aucun bucket de composition (`ratees` exige un vote arevoir/hésité, `jamaisVues` exige `votes[id] === undefined` ET l'absence de `vues`) : `contexts/ReviewContext.tsx:55-61` vs `:238-248`. Rejoignable par le flux normal. **Disposition : fix-now proposé (action item 2)** — la règle de composition doit ré-offrir les passes présentées-non-sues-non-exclues.
- **[MEDIUM] Le rattrapage de créneau emporte l'écran de fin sous les yeux** : assis sur « C'est fini pour cette session », l'intervalle 30 s (`ReviewContext.tsx:221-224`) recompose à l'échéance : `passesVues` remis à zéro, la file se remonte sans action — `:201`. **Disposition : fix-now proposé (action item 3)** — l'écran de fin doit survivre à l'échéance jusqu'à navigation.
- [LOW] « Geste indisponible. » s'affiche sur la carte **suivante** pendant 6 s (`session-revision.tsx:144`) — attribution visuelle trompeuse. Defer.
- [LOW] Session héritée ouverte de >4 h : discard silencieux au chargement (`ReviewContext.tsx:120-122`) — **accepté** : design délibéré de la story 1.7 (documenté au Triage de son plan).
- [Checked-clean] Plein écran id-keyé ne reste pas collé sur un créneau recomposé (`session-revision.tsx:230-237`) ; la porte exclue jamais hors session (`GifPlayer.tsx:176-179`, gardes ref :46-48).

### Fix pendant la rétro (fait, sourcé)
- **[MEDIUM→FIXED-localement] R6 rompue sur le build déployé** : le bundle prod (`entry-9a5eb4f6`, téléchargé et greppé) contenait `pub-e9db5024` (r2.dev) et **pas** `gif.kartaro.fr` — `EXPO_PUBLIC_CLOUDFLARE_R2_CUSTOM_DOMAIN` avait été ajouté à `.env.development.local` (story 1.2) mais jamais à `.env.production`. Complétion de l'approbation AD-4 donnée par l'utilisateur : var ajoutée, rebuild `--clear` (piège du cache Metro, AGENTS.md), nouveau bundle local `entry-8911df6f` contient le domaine ✓. **Déploiement final bloqué : 4 timeouts consécutifs de l'API Cloudflare (réseau)** — open item 1.

## Behavior verification

- **Exercé en headless local** (sondes du run) : parcours complet register→revise→révélation→votes(3 états)→plein écran→croix ; barre de votes présente (À revoir/Hésité/Su/Passer/Plein écran = true dans le DOM après révélation) ; file recomposée sur simulation de jour ; garde des tabs tenue à 0,5 s ; cookie + `/auth/me`=200 après reload ✓ — références : les scripts de sonde cités dans les deux feuilles backlog + memlogs.
- **Exercé sur le déployé** : hash du build vérifié (`9a5eb4f6` → `8911df6f` → `78571d18` tous servis à tour de rôle), CORS preflight prod pour `rock4me.pages.dev` = 204 + Allow-Origin ✓, `/health` prod healthy ✓, worker prod déployé (version 76337037 : `/me` lit le cookie + CORS).
- **Validé par l'utilisateur sur la déployée 2026-11-01** : « J'ai testé. Le résultat me convient. » (tests sur `rock4me.pages.dev` : fix grille desktop + le produit épic) — le done-when d'intégration (« la Pages déployée joue une session complète en conditions réelles ») est couvert par cette validation utilisateur, l'utilisateur jouant ses sessions sur l'URL de production depuis le déploiement.

## Previous-retro follow-through

— (première rétrospective du projet)

## Action items (proposés — à la décision humaine)

1. **✅ FAIT 2026-11-01 — Redéployer le bundle corrigé** sur `rock4me` (en ligne : `8911df6f` puis `78571d18` grille corrigée, vérifiés par téléchargement du bundle servi ✓). Le projet secondaire `rock4you` : config production branch corrigée (`majergonomie` → `main`) mais son déploiement dernier a échoué réseau (build en attente dans `dist/`, 1 commande à rejouer).
2. **Rattraper les passes « Passées »** dans la composition (`ReviewContext.tsx:55-61`) — une passe présentée non votée non exclue doit être re-proposable. Owner : Sofia (à trancher : règle de ré-entrée).
3. **Faire survivre l'écran de fin à l'échéance du créneau** (`ReviewContext.tsx:201, 221-224`) — le rattrapage ne doit pas effacer « C'est fini pour cette session » sous les yeux ; recomposer à la prochaine navigation. Owner : Sofia (story à trancher).
4. **Dé-duplication** : porte média (GifPlayer/FullScreenImageModal), clones GifPlayer↔CachedGif, transitions ReviewContext, config R2, blocs cookie worker. Owner : épics suivants (story de ménage).
5. **Réconcilier la spec** : le corps R1/done-when de `epic-boucle.md:27, 33` vs la Decision créneau 4 h (`:58`) — Owner : Sofia (SPEC).
6. **AGENTS.md — section Deploy** : le workflow `deploy-cloudflare.yml` n'a jamais existé sur `origin/main` (la doc décrit un pipeline absent) ; le projet Pages `rock4me` pointait sa production branch sur `majergonomie` (corrigé → `main` pendant la rétro) ; déploiement réel = `wrangler pages deploy --branch=<prod>`. Owner : `bmad-project-context`.
7. **Backlogs déjà en file** (repointés) : `backlog/landing-aveugle-a-la-session.md` (id 1), `backlog/logbox-text-node-boucle-search.md` (id 2).

## Acceptance verdict

**accepted-with-open-items** — critères **déclarés** (epic-boucle.md Done when).

Base de l'appréciation :
- 7/7 stories done avec vérifications utilisateur par story (evidence : plans status done + memlogs datés).
- Les critères locaux tiennent (file plafonnée ✓, geste masqué/révélé ✓, votes à 3 états ✓, sues consultable ✓, sans geste jamais dans la file ✓, exclusion persistée ✓, cache web vérifié sur la déployée **une fois la variable en place** — pending item 1, plein écran ✓, créneau 4 h ✓ vérifié en local).
- Le critère d'intégration (« la Pages déployée joue une session complète ») reste **ouvert** : le build déployé en ligne ce soir (`9a5eb4f6`) portait le trou R2 corrigé depuis (`8911df6f` en attente de réseau) et l'utilisateur n'a pas encore joué de session complète sur la déployée.
- Verdict accepté **avec items ouverts** plutôt que rejeté : les défauts trouvés (1 high, 2 medium, 4 low) sont des items de suivi traçables, aucun ne remet en cause les critères atteints en local ; l'open-item d'intégration est en passe de fermeture technique.

## Open questions

- La re-révision d'une passe « Passée » (action item 2) — règle exacte de ré-entrée au créneau suivant ?
- Le wording des Requirements (`epic-boucle.md:27`) doit-il être réécrit en créneau (reconcile) ou laissé en historique avec la Decision en Notes ?
- `sues` cumul toutes époques : suffisant, ou faut-il une vue par créneau pour la spine ?
- Le backlog id 2 (LogBox text-node) — la boucle « Maximum update depth » a-t-elle survécu au push (elle vivait sur /search pré-épic) ?