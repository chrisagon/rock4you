# Recherche vérité-techno — spine architecture-phase-1

**Date :** 2026-10-28 · **Type :** revue vérité-techno (review-only, spine inchangé) · **Objet :** `DocumentationR4Y/initiative-rock4me/architecture-phase-1/architecture-phase-1.md`

## Verdict global

Spine globalement véridique et fidèle au code. L'essentiel d'AD-5 (validation du JWT Access à chaque requête, CORS réglé côté application Access) et la recommandation Pages→Workers static assets sont confirmés par la documentation officielle à jour. Deux corrections attendues : (1) la prémisse AD-5 « aucun hostname `*.workers.dev` ne peut porter Access » est contredite par la doc Cloudflare Workers la plus récente — la décision migration- hostname reste défendable mais sa justification n'est plus une impossibilité plateforme ; (2) le seed Expo SDK 53 / RN 0.79 est cinq générations de SDK derrière le SDK 58 courant et la table Stack ne signale pas cette dérive. Aucune trouvaille critique : rien dans le paradigme (client riche hors-ligne + Worker sans état) n'est menacé par la réalité plateforme.

## Sources vérifiées (le 2026-10-28, docs officielles uniquement)

| Source | Date « Last updated » à la lecture | Usage |
| --- | --- | --- |
| developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/self-hosted-public-app/ | 2026-04-17 | exigence « Domains must belong to an active zone in your Cloudflare account » ; CORS en Additional settings ; « Cloudflare checks every HTTP request ... for a valid application token » |
| developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/ | 2026-05-06 | en-tête `Cf-Access-Jwt-Assertion` + cookie `CF_Authorization` ; recommandation d'en-tête ; exemple Workers (jose, JWKS, `iss` = team domain, `aud` = AUD tag) ; rotation des clés (6 semaines) |
| developers.cloudflare.com/workers/configuration/cloudflare-access/ | 2026-10-12 | protection hostname workers.dev / Worker entier / account ; destinations API `worker`, `preview_worker`, `all_workers`, `all_preview_workers` ; `ctx.access` ; caveat Static Assets ; WebSocket non supporté en Access niveau Worker |
| developers.cloudflare.com/workers/previews/ | 2026-09-24 | Preview URLs protégées par Access ; « Worker Previews requires Wrangler 4.135.0 or later » |
| developers.cloudflare.com/pages/ | 2026-08-25 | bannier « Are you sure you want to use Pages? ... Start new projects with Workers » |
| developers.cloudflare.com/workers/static-assets/migration-guides/migrate-from-pages/ | 2026-10-12 | chemin exact de migration (assets.directory, not_found_handling, run_worker_first, `_headers`/`_redirects`, wrangler dev sur 8787) |
| expo.dev/changelog + expo.dev/changelog/sdk-58 | SDK 58 publié 2026-10-15 | SDK courant = 58 (RN 0.88, iOS 27) ; SDK 57 (juin 2026), 56 (mai 2026) |
| hono.dev/docs | site officiel | ligne majeure v4 confirmée, pas de v5 |

`reactnative.dev/docs/support-policy` a répondu 404 à la lecture ; l'écart RN est donc quantifié via le changelog Expo plutôt que par la politique de support RN.

## Vérifications locales

- `package.json` : expo ^53.0.20, react 19.0.0, react-native 0.79.1 — concordants avec la table Stack (lignes 91-99).
- `worker/package.json` : hono ^4.0.0, @hono/zod-validator ^0.2.0, wrangler ^4.26.0, vitest ^1.0.0 — concordants avec la table Stack.

## Findings

### F1 · HIGH · AD-5 (ligne 77) + Deferred (ligne 152) — « workers.dev ne peut porter Access » contredit par la doc actuelle

- **Énoncé du spine :** « Aucun hostname `*.workers.dev` ne peut porter Access : l'app et l'API se déploient sur des hostnames d'une zone possédée. »
- **État de la doc :** la page Workers « Cloudflare Access » (upd. 2026-10-12) documente explicitement la protection d'un hostname workers.dev précis — « you can protect `my-worker.example.workers.dev` ... by creating a self-hosted application and using the hostname as the application domain » — plus deux autres voies qui couvrent workers.dev et les previews (Access au niveau Worker : « automatically protects every domain associated with the Worker, including ... `workers.dev` hostname, and previews » ; Access au niveau compte : `all_workers` / `all_preview_workers`). La page Previews (upd. 2026-09-24) et le guide migrate-from-pages confirment que les URL workers.dev peuvent être protégées par Access. La doc Zero Trust self-hosted (upd. 2026-04-17) dit encore « Domains must belong to an active zone in your Cloudflare account » : conflit entre deux pages officielles ; la plus récente et la plus spécifique (Workers, 2026-10-12) prime.
- **Correction :** conserver la décision hostname de zone possédée — elle reste raisonnable (contrôle du DNS, CORS, marque, previews sur domaine) — mais re-formuler la justification comme un choix, pas une impossibilité : ce qui était la raison d'être de la migration Deferred (ligne 152) disparaît, et l'épic Access R3 pourrait être livrée plus tôt sur `*.workers.dev` + Access, la migration de hostnames devenant optimisable ou reportable.

### F2 · MEDIUM · Table Stack (lignes 89-99) — seed Expo vétuste sans note de dérive

- Le tableau est honnête (« SEED — vérifié sur le code au 2026-10-28 ») et fidèle au code. Mais l'écosystème a bougé : SDK 58 publié le 2026-10-15 (RN 0.88, iOS 27), SDK 57 en juin 2026, SDK 56 en mai 2026 — SDK 53 est cinq générations de SDK derrière la version courante, avec RN 0.79 contre 0.88 courant.
- Les sorties de RN 0.87/0.88 apportent des changements qui toucheront l'upgrade : Strict TypeScript API par défaut dès RN 0.87 (opt-out `react-native-legacy-deep-imports` à retirer après RN 0.89), R8 activé par défaut sur Android, cycle de vie scene iOS 27, web output `server` par défaut côté Expo Router.
- **Correction :** ajouter une note de dérive dans la table (seed ≠ courant, écart = 5 SDK) et prévoir une épic d'upgrade SDK (avant ou après la phase 1, mais planifiée) pour ne pas enfermer la phase 1 dans un seed qui vieillit sous elle. React 19 reste la ligne majeure courante (aucun EOL constaté) ; le 19.0.0 épinglé est simplement minor derrière les 19.x récents.

### F3 · LOW · AD-5 (ligne 77) — en-tête recommandé sur cookie ; `ctx.access` est une alternative actuelle

- La doc « Validate JWTs » (upd. 2026-05-06) confirme la présence des deux transporteurs — en-tête `Cf-Access-Jwt-Assertion` sur chaque requête, cookie `CF_Authorization` pour les navigateurs — mais recommande explicitement de valider l'en-tête « since the cookie is not guaranteed to be passed ». Le spine présente « en-tête `cf-access-jwt-assertion` ou cookie » comme des options équivalentes.
- Le middleware JWT reste une guidance actuelle (l'exemple Workers officiel utilise jose + JWKS distant + `iss`/`aud`), mais une voie plus simple existe désormais : `ctx.access.getIdentity()` dans le Worker (« No extra configuration or JWT parsing is required »), avec un bloc `access.dev` de wrangler pour tester localement. Caveat officiel : avec Static Assets, le routeur interne ne transmet pas `ctx.access` au Worker utilisateur — acceptable pour l'API pure, à garder en tête si l'app migrée sur Workers static assets veut lire l'identité côté web.
- **Correction :** écrire « en-tête (recommandé), cookie en secours navigateur » et mentionner `ctx.access` comme alternative à arbitrer dans l'épic Access.

### F4 · LOW · Table Stack ligne 97 — « Pages en maintenance » : substance confirmée, littéral vieilli

- La page Pages (upd. 2026-08-25) affiche le bannier « Are you sure you want to use Pages? Workers supports most Pages use cases ... Start new projects with Workers » et le guide « Migrate from Pages to Workers » (upd. 2026-10-12) documente le chemin précis (champs `assets.directory`, `not_found_handling: single-page-application`, `run_worker_first` pour l'auth middleware, `_headers`/`_redirects` supportés, `wrangler dev` sur 8787). Le littéral « maintenance mode » n'apparaît plus sur les pages lues ; la réalité — Workers static assets est la voie recommandée — est vérifiée.
- Deux nuances utiles pour la migration prévue : Workers n'accepte pas de domaines dont les nameservers ne sont pas chez Cloudflare (convergence avec F1) ; les Previews requièrent Wrangler 4.135+.
- **Correction :** reformuler la cellule en citant le bannier (« Redirect new projects to Workers ») plutôt que le vieux littéral ; la décision (« migration au prochain déploiement, non un chantier ») tient.

### F5 · LOW · worker/package.json — dettes non listées dans la table Stack

- `@cloudflare/workers-types` ^4.20240117 : la date de génération des types (2024-01-17) est dans l'identifiant de version ; presque trois ans de retard au 2026-10-28, antérieur à des types récents (dont `ctx.access`). `Vitest` ^1.0.0 : hors périmètre de cette revue (non vérifié web), suspicion d'ancienneté — à contrôler avant d'écrire les premiers tests.
- **Correction :** si la table Stack veut refléter les dettes de l'API, ajouter `workers-types` avec l'écart de date ; prévoir la montée de types dans l'épic Access (les typings de `ctx.access` en dépendraient).