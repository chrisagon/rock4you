# Recherche rubric — spine architecture-phase-1

*Revue rubric-walker, review-only, 2026-10-28. Sources : architecture-phase-1.md (156 l.), son .memlog.md (20 l.), initiative-rock4me.md (80 l.). Assertions code vérifiées sur le dépôt (package.json racine, worker/package.json, worker/migrations/*.sql, utils/gifCache.ts, AGENTS.md) ; assertions web vérifiées contre le memlog « version » uniquement, sans re-consulter le web.*

## Verdict global

Bon spine de niveau initiative : il ratifie fidèlement le brownfield (routes, migrations, providers, gardes web de gifCache), ses AD sont dans l'ensemble applicables, et l'enveloppe opérationnelle est **présente**, ce que la plupart des spines oublient. Mais deux contradictions réelles subsistent dans l'enveloppe auth/déploiement — la convention `EXPO_PUBLIC_API_URL` pointe le hostname de zone alors que la migration correspondante est différée, et la posture d'authentification en dev (localhost:8787 sans Access) n'est pas décidée — plus quelques contenus du memlog perdus en route (question de la zone, chemin du point de terminaison d'ordre). À corriger, notamment les deux high, avant le slicing : sans elles, l'épic Access et la première story client applis divergent dès l'écran d'accueil.

---

## 1. Point de divergence réels pour le niveau en dessous — manqués ou couverts ?

**Verdict : adequate.**

Les cinq vraies sources de divergence à cette altitude sont fixées : l'ordre des passes (`added_at` implicite contre `rank` explicite — la colonne `added_at` existe bien dans `0001_initial_schema.sql:61` et aucun `rank` n'existe, la divergence est réelle), l'autorité d'authentification, la lecture média, le hors-ligne, et l'état de séquence. Le point R6 n'est couvert que partiellement.

### Findings

- **[medium] AD-4 omet la charge à la révélation pendant la navigation.** R6 (initiative l.40) exige « le geste ne se charge qu'à la révélation, jamais avant pendant la navigation » ; le brief (l.62) et le memlog du brief (l.16) le confirment, et le contre-exemple code est documenté (GifPlayer ajoute `?t=Date.now()`, addendum l.19). AD-4 (l.71) fixe le plafond de préchargement « pendant qu'un autre joue » — clause qui ne s'applique pas à la navigation, où rien ne joue : une unité implémentant le catalogue pourrait précharger le GIF suivants sans violer AD-4. *Correction : ajouter à AD-4 « pendant la navigation, aucun téléchargement avant la révélation ; pendant l'enchaînement, au plus le geste suivant ».*
- **[medium] AD-2 ne nomme plus le point de terminaison d'ordre.** Le memlog (l.15) le fixait — `PUT /api/lists/:id/passes/order` — le spine ne dit plus que « un appel batch » « sous /api/lists » (l.59, l.109). Or deux fichiers montent déjà `/api/lists` (`routes/lists.ts` avec `/passes`, `routes/moves.ts` avec `/moves`) : un implémenteur peut poser le point dans le mauvais fichier ou inventer un chemin. *Correction : rétablir verbe + chemin dans AD-2 et le fichier cible (`routes/lists.ts`).*

---

## 2. Chaque Rule d'AD est-elle applicable et prévient-elle sa divergence annoncée ?

**Verdict : adequate.**

AD-1 et AD-2 sont applicables par inspection du code (pas d'écriture catalogue, réordonnancement en ligne uniquement, client qui ne trie pas sur `added_at`). AD-3 est applicable (aucun point de terminaison de séquence). AD-4 le serait après la clause manquante ci-dessus. AD-5 a deux trous d'exécution.

### Findings

- **[high] La posture d'authentification en dev n'est pas décidée.** Le diagramme (l.117) porte le dev sur `localhost + 8787` (wrangler dev), hors Access ; AD-5 exige que « chaque requête porte sa preuve... vérifié par middleware ». Sur localhost, aucune application Access n'intercepte : la règle est indécidable en dev telle qu'écrite. Première story client qui appelle l'API en dev la contournera à sa façon — drapeau contournant dans le middleware (risque d'arriver en prod) ou dev pointé sur l'API de prod. *Correction : une seule ligne dans AD-5 ou les conventions, p. ex. « en dev, le middleware accepte un jeton test signé par la variable d'environnement wrangler, jamais en prod ».*
- **[medium] AD-5 ne verrouille pas le middleware comme global.** La divergence annoncée est « une faille si une route saute la vérification » (l.76) ; la rule dit « vérifié par middleware » sans préciser *global, monté avant tout montage de routes, `/health` inclus*. Un middleware câblé par groupe de routes laisse filer une route ajoutée ensuite. *Correction : « middleware global dans `src/index.ts`, monté avant tout `route()`, aucune exception ».*
- **[low] La clause change-control d'AD-3 est corrompue.** « reçoit un AD au-moins-justifié » (l.65) veut dire « un AD dédié et justifié » mais se lit mal ; idem « en tache de fond » (l.53), « aucun secret d'accords » (l.77), « nouvel point de terminaison » (l.109). Sur une phrase d'arbitrage de changement, l'ambiguïté peut être mal lue comme « un AD est optionnel ». *Correction : « tout changement d'épic qui introduirait un état serveur de lecture obtient son AD propre, justifié ».*

---

## 3. Rien sous Deferred ne laisse deux unités du niveau en dessous diverger ?

**Verdict : thin.**

La plupart des ajournements sont propres (gel d'image = une story ; synchronisation multi-appareils consentie et tracée au memlog l.10 ; SRS/partage = ne rien construire). Mais le premier ajournement contredit l'état actuel que le spine lui-même rend obligatoire.

### Findings

- **[high] Contradiction AD-5/conventions contre Deferred sur le hostname de zone.** AD-5 (l.77) pose comme exigence actuelle « l'app et l'API se déploient sur des hostnames d'une zone possédée » ; les conventions (l.85) exigent que `EXPO_PUBLIC_API_URL` « pointe le hostname d'API de la zone possédée » — **maintenant** — alors que Deferred (l.152) diffère la migration `*.workers.dev` → zone « à l'épic Access ». L'unité « config client » suivra la convention et écrira une URL de zone qui n'existe pas encore ; l'unité « épic Access » basculera plus tard. Deux unités, deux états. *Correction : découper l'état transitoire de l'état cible — jusqu'à ce que la modification de l'épic Access soit fusionnée, `EXPO_PUBLIC_API_URL` garde l'URL workers.dev actuelle ; la convention de zone s'applique au moment du basculement, un AD ou une convention de basculement le fixe.*

---

## 4. Nom de technologies vérifié à jour — les dates de vérification remontent-elles au memlog ?

**Verdict : adequate.**

L'assertion web d'AD-5 (applications self-hosted Access exigent un hostname de zone ; `*.workers.dev` ne peut pas se porter derrière Access, docs 2026-04, l.77) est **exactement traçable** à l'entrée `(version)` du memlog (l.19, web-verified 2026-10-28) — chaîne complète. Les versions du tableau Stack se vérifient sur le code et tout est exact au 2026-10-28 : expo ^53.0.20, react 19.0.0, react-native 0.79.1, lucide-react-native ^0.475.0 (package.json racine l.31–49) ; hono ^4.0.0, @hono/zod-validator ^0.2.0, wrangler ^4.26.0, vitest ^1.0.0 (worker/package.json l.16–24), et de deux migrations 0001/0002. Les chiffres 16,8 Mo par GIF / 84 Mo pour cinq passes remontent au addendum §1 et au brief l.72.

### Findings

- **[medium] L'assertion « Pages en maintenance » n'a aucune trace.** La ligne Stack (l.97) affirme « Pages en maintenance : migration Workers static assets au prochain déploiement, non un chantier » — affirme de plateforme du même niveau que l'assertion web-verified d'AD-5, mais le memlog ne porte **aucune** entrée `(version)` pour elle, et sa date de vérification n'existe pas. La rubrique demande que les dates de vérification remontent au memlog. *Correction : ajouter une entrée `(version)` au memlog (source + date), ou retirer l'affirmation de la table Stack.*

---

## 5. Ratifie-t-il le brownfield plutôt que de le contredire ?

**Verdict : strong.**

C'est le point fort du spine. Vérifications code : les points montés du seed (l.108) correspondent aux mounts réels (`/api/auth/*`, `/api/users/*`, `/api/lists/*`, `/api/favorites/*`, `/health`) ; les deux fichiers de routes avec `/passes` et `/moves` correspondent ; quatre migrations à deux fichiers conformes ; `PassesSauvegardes` a bien `added_at` et pas `rank` (la « migration de rang à ajouter » est juste) ; les gardes `Platform.OS === 'web'` de `utils/gifCache.ts` (l.25, 65, 120, 149...) sont explicitement à conserver ; AuthProvider global et PlaylistProvider sous les tabs correspondent ; la dette de nommage (`rock4you-api`, buckets R2, logo) correspond au memlog l.13. AD-1/AD-5 sont étiquetés avec l'origine ([ADOPTED — réalité du code] contre [ADOPTED — brief C]) : le lecteur sait ce qui est changement, pas ratification fictive. Les chiffres 244/215 du catalogue sont conformes au brief l.12.

### Findings

- **[medium] L'inventaire de retrait d'AD-5 est absent.** AD-5 sort « les routes `/api/auth/*` à mots de passe du chemin d'exécution » et interdit tout écran de connexion, mais le brownfield porte tout un tas de retrait que le spine ne nomme nulle part : routes `/api/auth/*` et leur middleware JWT maison, `/app/login` + `app/(auth)/login.tsx`, les boutons de connexion de la landing `app/index.tsx`, la logique token/refresh (et le gotcha `GET /api/auth/me` Bearer-only, addendum l.58) du AuthProvider, et le rôle du verrou dans `app/(tabs)/_layout.tsx`. Une unité du niveau en dessous peut hésiter entre supprimer et brancher hors du chemin — et la landing garde des boutons morts. *Correction : une ligne Deferred ou plan-side « retraits à l'épic Access : routes /api/auth/*, écrans /login, boutons de la landing (remplacés par l'entrée Access), logique refresh du AuthProvider ».*
- **[low] L'étiquette du diagramme `"/api/listes"` n'existe pas.** Le mermaid du paradigme (l.34) nomme `/api/listes · /api/auth` ; le mount réel est `/api/lists`. Étiquette à prendre littéralement par un lecteur pressé. *Correction : `/api/lists · /api/auth` (et idéalement la liste complète des mounts comme en l.108).*

---

## 6. Le ticket a-t-il une exigence non couverte (R1–R6) ?

**Verdict : adequate.**

La carte Capability → Architecture (l.140–147) couvre les six R, avec emplacement + AD gouvernants ; les contraintes sont traitées : C1 lié à AD-4 et au diagramme (r2.dev en phase 1 l.121, chiffres 84/16,8 Mo), C2 par Deferred (l.155 « rien ne se construit pour »), C3 par le diagramme de données (ListeMembres « partage doux, hors phase 1 »). L'ordre des épics et les hypothèses du ticket (l.75–79) sont repris en Deferred (l.156). Deux exigences portent des trous déjà listés : R6 (charge à la révélation — finding §1) et R3 (voir §2/§5 pour l'exécution), plus un ici.

### Findings

- **[medium] R3 sans carte identité → ligne Utilisateurs.** « Un utilisateur authentifié retrouve ses listes et ses favoris » (initiative l.34) suppose une correspondance entre l'identité Access (JWT : claim `sub`/email) et la ligne D1 de `Utilisateurs` — aujourd'hui branchée sur le JWT maison. Le spine ne décide ni ne diffère : auto-provisionnement à la première connexion contre pré-ensemencement de l'utilisateur unique. Unité à unité, l'Access épic implémentera l'un ou l'autre. *Correction : une ligne convention — « l'e-mail du JWT Access identifie la ligne Utilisateurs ; utilisateur unique pré-seeded, point de provisionnement à la première connexion »* (le choix exact au slicing est tolérable s'il est tracé comme question ouverte).

---

## 7. Chaque dimension détenue par cette altitude est-elle décidée, différée ou en question ouverte ?

**Verdict : adequate.**

L'éperon louable : la section « Déploiement et environnements (l'enveloppe opérationnelle de cette altitude) » (l.113–123) existe et tranche le paradigme (l.24) et la pile (l.87–98). Deux environnements (dev localhost/wrangler, prod zone possédée), stratégie fournisseur tout-Cloudflare, r2.dev en phase 1 explicité. Trois manques, dont deux reportés des autres sections (contradiction hostname §3 ; posture dev §2).

### Findings

- **[medium] La question ouverte de la zone a été perdue en route.** Le memlog (l.20) porte « which owned zone/domain carries app (Pages) and api (custom domain bound to Worker) » — question réelle, à trancher dans l'épic Access. Le spine ne la porte pas dans Deferred ni ailleurs : un implémenteur du niveau en dessous ne sait pas qu'elle reste ouverte. *Correction : la porter dans Deferred, formulation du memlog.*
- **[low] Exploitation absente, même comme choix assumé.** Logs Worker, sauvegarde D1, observabilité Access : la dimension operation est à cette altitude et ne se retrouve ni décide ni différée. Pour une app mono-utilisateur le choix « rien en phase 1 » est raisonnable — mais il doit exister sur papier pour que le niveau en dessous ne le découvre pas en prod. *Correction : une ligne Deferred « exploitation (logs, sauvegarde D1, monitoring Access) : volontairement hors phase 1 ».*

---

## Récapitulatif des verdicts

| # | Point du checklist | Verdict |
| --- | --- | --- |
| 1 | Divergences réelles fixées, rien de manqué | adequate |
| 2 | Rules applicables et préventives | adequate |
| 3 | Deferred sans divergence possible au niveau en dessous | **thin** |
| 4 | Tech vérifiée à jour, traceable au memlog | adequate |
| 5 | Ratification du brownfield | strong |
| 6 | Couverture complète du ticket (R1–R6) | adequate |
| 7 | Dimensions de l'altitude toutes arbitrées | adequate |

**Global : adequate — spine traçable et brownfield-fidèle, à rafraîchir avant le slicing sur les deux high (contradiction hostname de zone ; posture dev sans Access) et sur les mediums AD-5 (middleware global, carte identité, inventaire de retrait).**

## Synthèse des findings

| Severité | Nombre | Identifiants |
| --- | --- | --- |
| critical | 0 | — |
| high | 2 | §2 posture dev ; §3 contradiction EXPO_PUBLIC_API_URL vs Deferred |
| medium | 7 | §1 charge à la révélation ; §1 point d'ordre non nommé ; §2 middleware global ; §4 Pages au memlog ; §5 inventaire de retrait ; §6 carte identité → Utilisateurs ; §7 question zone perdue |
| low | 3 | §2 prose corrompue ; §5 étiquette /api/listes ; §7 exploitation non assumée |