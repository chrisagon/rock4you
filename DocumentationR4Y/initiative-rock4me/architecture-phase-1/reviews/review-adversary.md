---
reviewer: adversaire (spine architecture-phase-1)
date: "2026-10-28"
scope: REVISION-ONLY — aucun code écrit ; cette revue est un artefact
inputs:
  - DocumentationR4Y/initiative-rock4me/architecture-phase-1/architecture-phase-1.md
  - DocumentationR4Y/initiative-rock4me/architecture-phase-1/.memlog.md
  - DocumentationR4Y/initiative-rock4me/initiative-rock4me.md
---

# Recherche adversaire — spine architecture-phase-1

## Verdict global

**Approuvé sous conditions — 8 incompatibilités de paires trouvées, 2 critiques à fermer avant slicing.**

À l'altitude initiative, le substrate tient : AD-1 pose les propriétaires, AD-2 tranche l'ordre, AD-3 refuse un état serveur, AD-4 plafonne le média, AD-5 sort l'auth maison. La méthode des AD a bien fonctionné là où elle a été écrite.

Mais la descente d'un niveau (deux stories de phase 1 construites chacune *à la lettre* de tous les AD) produit huit paires qui composent en incompatibilités : formes de données partagées non fixées, deux propriétaires de fait sur `PassesSauvegardes` et sur la couche auth, chemins de mutation d'état concurrents. La cause commune : les AD tranchent les choses nommées (`rank`, `/api/auth/*`) et laissent orphelines les surfaces adjacentes (l'INSERT d'un flux favoris, `/api/users/*`, le client `services/api.ts`, la cible native, le mot « Terminer »). Le Structural Seed est lui-même en autoparadoxe : il liste encore les montages `/api/auth/*` et `/api/users/*` que AD-5 sort du chemin d'exécution.

Réponses aux questions explicites de la mission :
- **Les Différées font-elles diverger deux unités ?** Oui — la différée « migration de zone » contredit la convention `EXPO_PUBLIC_API_URL` (pair 5) et la question ouverte « dette des listes » n'a pas de propriétaire (pair 7).
- **AD-2 « un appel batch à Terminer » conflit-il avec AD-4 ?** Pas sur les médias en direct ; oui via le mot « Terminer » (quel écran détient l'écriture ?) et via le Rejouer qui relance la lecture et repasse dans le chemin AD-4/cache sans règle (pair 6).

Chaque paire ci-dessous propose un AD nouveau ou resserré, rédigé pour trancher.

---

## Pair incompatibility 1 : story « réordonnancement » vs story « ajouter une passe à une liste » — deux contrats d'écriture sur PassesSauvegardes (critical)

**Deux unités (niveau stories, épic R4 / flux Catalogue→Favoris du tracer path)**

- **U-A « rang et réordonnancement »** : crée la migration `rank INTEGER` sur `PassesSauvegardes`, ajoute `PUT /api/lists/:id/passes/order`, sert la liste triée par `rank`. Obéit à la lettre d'AD-1 (l'ordre vit en D1), AD-2 (batch unique, 1..n sans trou), convention « rangs réécrits 1..n sans trou à chaque écriture ».
- **U-B « flux favoris / ajout d'une passe à une liste »** : depuis Catalogue/Favoris, INSERT une ligne dans `PassesSauvegardes` (`passe_id`, `liste_id`, `added_at`). Obéit à la lettre d'AD-1 (la liste est en D1, pas en local), AD-2 (AD-2 ne gouverne que le réordonnancement — un INSERT n'est pas un réordonnancement), AD-3 (aucun serveur de séquence).

**Là où elles se heurtent (forme de donnée partagée)**

AD-2 ne fixe **que** l'écriture de réordonnancement. L'INSERT de U-B est une écriture sur la même table sans règle assignée. Deux implémentations légitimes de la lettre divergent :
1. U-B insère avec `rank` NULL (ou 0) — l'invariant « 1..n sans trou » est cassé dès la première passe ajoutée ; le lecteur de U-A trie par `rank` et les NULL passent en tête/fin selon SQLite, l'ordre affiché est arbitraire ; le batch de réécriture de U-A rencontre des NULL qu'il n'a jamais prévu de traiter.
2. U-B insère sans contrainte `UNIQUE(liste_id, passe_id)` — la même passe peut être ajoutée deux fois ; le diagramme ER (`ListesFavorites ||--o{ PassesSauvegardes`) et la réécriture 1..n n'ont plus de sens.
3. Si U-B passe par un autre chemin de route que celui de U-A (par ex. un helper sous `routes/moves.ts` vs une route sous `routes/lists.ts`), deux familles d'écritures coexistent sans invariant commun.

**AD proposé (resserrer AD-2)**

> **AD-2 (resserré)** — Toute écriture sur `PassesSauvegardes` (insertion, suppression, réordonnancement) passe par la **seule** famille de routes `/api/lists/:id/passes*` et maintient l'invariant de rang **serveur, dans la même transaction** : l'insertion ajoute en fin de liste à `MAX(rank)+1` ; la suppression compacte en 1..n-1 ; la réécriture produit 1..n sans trou ; `UNIQUE(liste_id, passe_id)` en base. Aucune story n'ajoute un chemin d'écriture sur `PassesSauvegardes` en dehors de cette famille ; une story qui doit y écrire consomme la story rang, elle n'en recrée pas le contrat.

---

## Pair incompatibility 2 : story « enchaînement » vs story « réordonnancement » en course sur la même liste — deux chemins de mutation d'un ordre (high)

**Deux unités (épic R4, deux stories parallèles)**

- **U-A « enchaînement »** : lit la liste via l'API au lancement, joue séquentiellement. Obéit à AD-3 (aucun état serveur, lecture purement locale) et AD-4 (un-davant).
- **U-B « réordonnancement »** : manipule localement un ordre brouillon dans l'écran de liste, puis « le réordonnancement s'écrit en un appel batch à Terminer » (AD-2), en ligne seulement.

**Là où elles se heurtent (chemin d'état concurrent)**

1. **Le brouillon de U-B a une pente fatale vers le contexte partagé.** Les deux écrans vivent sous les tabs où `PlaylistProvider` est monté ; la modification la plus facile de U-B est de tenir le brouillon dans le provider — d'où une **source d'ordre locale** coexistante avec l'ordre D1. Chaque story obéit à la lettre (AD-2 interdit la *dérivation* de `added_at` et les écritures hors réseau, pas le brouillon local ; AD-1 interdit la local-source-de-vérité des listes, et « un brouillon pas encore écrit » passera pour un détail d'UX), mais la composition des deux crée exactement le « deux sources d'ordre qui divergent » que AD-2 prétend empêcher.
2. **Course multi-onglets (web trivial) :** deux onglets émettent deux `PUT .../passes/order` réécrivant 1..n — dernier écrivain gagne, sans garde, sans version, sans règle d'idempotence écrite. AD-2 ne déclare ni sémantique de concurrence ni écrit en vol.
3. **Ordre non spécifié au chevauchement :** user réordonne (brouillon actif), lance l'enchaînement. U-A lit-elle l'ordre serveur ou le brouillon ? AD-3 dit « une liste déjà lue via l'API » (serveur), l'UX laisse croire que le réordonnancement « fixe l'ordre de danse » immédiatement. Deux unités implémentent l'un et l'autre.

**AD proposé (resserrer AD-2 + AD-3)**

> **AD-2/AD-3 (resserrés)** — L'ordre manipulé avant « Terminer » reste **confiné à l'écran de réordonnancement** : il n'entre dans aucun contexte global (`PlaylistProvider`, store, props d'écran de l'enchaînement). L'enchaînement joue **toujours** l'ordre lu du serveur à son lancement ; s'il existe un brouillon non écrit, le lancement d'enchaînement est **bloqué** tant que le brouillon n'est pas écrit ou abandonné (un seul comportement, choisi ici : blocage, pas fusion). L'écriture d'ordre est idempotente (réécriture complète 1..n), un seul appel en vol côté client, sémantique last-write-wins sans fusion — assumée pour l'utilisateur unique.

---

## Pair incompatibility 3 : story « middleware Access » vs stories qui continuent de construire sur l'auth maison — `/api/users/*`, `/api/favorites/*`, `services/api.ts` et CORS orphelins (critical)

**Deux unités**

- **U-A « épic Access »** : ajoute le middleware vérifiant `cf-access-jwt-assertion` / cookie `CF_Authorization`, et fait sortir « les routes `/api/auth/*` à mots de passe » du chemin d'exécution ; CORS « se règle côté application Access » (AD-5).
- **U-B « flux favoris/listes »** (épics boucle→familles→enchaînement, qui précèdent Access dans l'ordre hypothèse du ticket) : écrit ses appels sur `services/api.ts` telle qu'elle existe — `credentials: 'include'`, types `access_token`/`refresh_token`, `POST /api/auth/login|register|logout`, routes `/api/favorites`, `/api/lists` — et construit sur `AuthProvider` avec écrans de connexion.

**Là où elles se heurtent (voies d'exécution et surface d'API)**

AD-5 nomme **seulement** `/api/auth/*`. Trois surfaces sont laissées orphelines, et la composition des deux letters-obéissances casse l'app :

1. **Le spine se contredit :** le Structural Seed liste encore les montages `/api/auth/*`, `/api/users/*`, `/api/favorites/*`. U-A peut légitimement ne retirer que ce qui est nommé ; le middleware maison qui protège `/api/users/*` et `/api/favorites/*` (Bearer **ou** cookie maison) reste monté et attend un jeton que plus personne ne délivre — les requêtes porteuses de `CF_Authorization` sont rejetées par le middleware maison, ou pire, celui-ci continue d'accepter un Bearer résiduel : deux systèmes de preuve cohabitent, la faille exacte que AD-5 prétend empêcher.
2. **Le client n'a pas de story de coupe :** rien ne désigne l'unité qui retire les écrans de connexion, le stockage de jetons, les types `access_token/refresh_token` de `services/api.ts`, et le fallback Bearer. Pendant que l'ordre des épics place le flux favoris **avant** Access, U-B investit dans la voie jeton (helpers, gestion 401→refresh) que U-A rayera au cutover — conflit architectural, pas seulement de merge.
3. **CORS :** le Worker porte encore `CORS_ORIGIN` en allowlist maison et `credentials: 'include'` ; AD-5 dit que « CORS se règle côté application Access » sans dire qui supprime `CORS_ORIGIN` ni quand. U-B « améliorant » CORS (ajout d'une origine de dev) et U-A le supprimant se courent dessus.

**AD proposé (resserrer AD-5 + AD-6 nouveau)**

> **AD-5 (resserré)** — Toute route protégée du Worker porte le **middleware Access** (helper unique, `cf-access-jwt-assertion` ou cookie `CF_Authorization`) ; le middleware JWT maison est supprimé de **toutes** les routes, pas seulement `/api/auth/*` ; `CORS_ORIGIN` et la logique CORS maison sont supprimés dans la même story de cutover. Le Structural Seed `worker/src/index.ts` est corrigé pour ne lister que `/api/listes/*`, `/api/utilisateurs/*` sous middleware Access et `/health`.
>
> **AD-6 (nouveau)** — L'authentification client a **un seul cutover** : une et une seule story (dans l'épic Access) détient le retrait des routes `/api/auth/*`, du stockage de jeton, des écrans de connexion et de l'attachement Bearer de `services/api.ts`. Jusqu'à ce cutover, les stories des épics précédents construisent sur la voie existante **sans l'étendre** : aucune nouvelle dépendance au chemin jeton (pas de nouveau stockage, pas de nouveau helper d'auth, pas de nouvel écran de compte). Le cutover se vérifie par `/health` (public) et une route protégée (401 sans preuve Access, 200 avec).

---

## Pair incompatibility 4 : story « cache web R6 » vs story « préchargement un-davant » — deux implémentations sur un chemin média unique, web et natif (high)

**Deux unités**

- **U-A « cache web R6 »** : « une passe révélée n'est téléchargée qu'une fois par navigateur » ; « le geste ne se charge qu'à la révélation, jamais avant pendant la navigation » (R6) ; retouche `utils/gifCache.ts` en gardant la garde `Platform.OS` (Structural Seed).
- **U-B « enchaînement »** : « l'appareil précharge au plus le geste suivant pendant qu'un autre joue » (AD-4).

**Là où elles se heurtent**

1. **Les deux règles se contredisent mot pour mot.** « Ne se charge qu'à la révélation » (U-A) interdit de charger le geste n+1 avant sa révélation ; le préchargement de U-B charge le geste suivant **avant qu'il soit joué/révélé à son tour**. Deux lettres-obéissances : U-A implémente une porte d'affichage stricte (le GIF ne monte qu'à la révélation) qui **casse** le réchauffage ; U-B implémente un préfetch qui **rend la porte inopérante**. Ni AD-4 ni R6 ne dit quelle règle l'emporte ni où.
2. **Deux caches sur web :** U-A peut servir le cache par headers HTTP/Cache API (`r2.dev` configurable) ; U-B peut précharger par `fetch`/`Image.prefetch` hors de ce cache — le « une fois par navigateur » est rompu pendant l'enchaînement même alors que le done-when du ticket le teste en navigation.
3. **Deux caches sur natif :** le cache fichier de `gifCache.ts` coexiste avec le cache interne d'`Expo Image` ; le préchargement de U-B par une voie (source directe) et la révélation par l'autre (cache fichier) téléchargent deux fois le même GIF sur l'appareil. Aucune politique d'éviction native n'existe en phase 1, donc « une fois » ne tient ni au Rejouer ni à l'éviction.
4. AD-4 interdit le cache-busting mais ne désigne pas le **module propriétaire** du chargement : rien ne force les deux stories à modifier le même chemin unique `utils/gifCache.ts` au lieu d'en ajouter un second.

**AD proposé (AD-7 nouveau)**

> **AD-7 (nouveau)** — Une seule porte média : toute lecture de GIF (révélation, enchaînement, préchauffage, Rejouer) passe par le même module de cache (`utils/gifCache.ts`), gardes `Platform.OS` conservées ; le préchargement un-davant **réchauffe ce même cache** (jamais un second chemin, jamais un second cache — y compris cache natif d'Expo Image contourné si présent). Définition tranchée : « à la révélation » = montée pour l'affichage servie du cache ; le réchauffage un-davant est autorisé **uniquement pendant un enchaînement lancé explicitement**, jamais en navigation — R6 et AD-4 coexistent par cette frontière, pas par des implémentations parallèles. Politique d'éviction native (plafond de cache) fixée dans la même story R6 pour tenir « une fois par session » au Rejouer.

---

## Pair incompatibility 5 : différée « migration de zone » vs convention « EXPO_PUBLIC_API_URL pointe la zone possédée » — deux cibles d'API (medium)

**Deux unités**

- **U-A « story d'anticipation »** (n'importe quel épic antérieur à Access) : applique la convention État & cross-cutting (« `EXPO_PUBLIC_API_URL` pointe le hostname d'API de la zone possédée ») et bascule l'env — alors que la Différée n°2 déclare la migration de zone « propre à l'épic Access » et que le hostname n'existe pas encore.
- **U-B « autres stories »** : gardent `rock4you-api.kartaro.workers.dev` (fallback silencieux de `services/api.ts`).

**Là où elles se heurtent**

La Convention et la Différée se contredisent aujourd'hui : deux builds légitimes divergent sur la cible d'API, et l'un pointe vers une ressource inexistante. Rien n'assigne la propriété de la variable d'environnement à une story unique ; le ticket lui-même documente le piège (`.env.development.local` vs `.env.production`, rebuild `--clear`).

**AD proposé (resserrer la Convention / la Différée)**

> Jusqu'au cutover de l'épic Access, `EXPO_PUBLIC_API_URL` **garde sa valeur actuelle** ; la convention « zone possédée » ne s'applique qu'à partir de la story de cutover, qui seule modifie l'env (dev et production) et reconstruit avec `--clear`. Aucune autre story n'écrit cette variable ni ne documente de nouveau hostname.

---

## Pair incompatibility 6 : AD-2 « un appel batch à Terminer » vs AD-4 / AD-3 — « Terminer » sans propriétaire, hors-réseau et Rejouer non tranchés (high)

**Deux unités**

- **U-A « réordonnancement »** : lit AD-2 comme « Terminer = bouton de mon écran » → l'écriture d'ordre vit dans l'écran de réordonnancement.
- **U-B « enchaînement »** : l'écran de fin (« Rejouer / retour », équivalent « terminé ») détient aussi une liste et son ordre : U-B peut légitimement lire AD-2 comme « flush l'ordre à la fin de la séquence » — et le Rejouer relance la lecture via le chemin média (AD-4).

**Là où elles se heurtent**

1. **AD-2 ne nomme pas l'écran propriétaire du « Terminer »** : deux écrivains potentiel du rang, hors du même épic ; U-B écrit des rangs que U-A s'attend à écrire seule — course sur `PassesSauvegardes` (cf. pair 2) et double UI de persistance.
2. **Hors-réseau à « Terminer » :** AD-2 interdit l'écriture D1 hors réseau mais ne dit pas ce que fait le bouton — file d'attente (violation AD-1/AD-2, réconciliation « en tâche de fond » interdite) ou désactivation ? Deux unités implémentent l'un et l'autre.
3. **Rejouer (AD-4 en aval) :** relancer la lecture repasse dans le chemin préchargement/cache sans règle explicite — recoupe la pair 4 ; AD-4 dit un-davant « pendant qu'un autre joue », silencieux sur la reprise.

**AD proposé (resserrer AD-2, préciser AD-4)**

> **AD-2 (resserré)** — « Terminer » désigne **le bouton de confirmation de l'écran de réordonnancement**, unique point d'écriture du rang ; l'écran de fin d'enchaînement n'effectue **aucune** écriture D1. Hors réseau, ce bouton est désactivé avec explication — jamais mis en file, jamais réconcilié plus tard (AD-1).
> **AD-4 (précisé)** — Rejouer rejoue depuis le cache sans re-téléchargement ; le un-davant ne s'arme que pour la poursuite de la séquence, pas à son redémarrage intégral (le cache déjà chaud suffit).

---

## Pair incompatibility 7 : propriété de la migration `rank` et contrat de lecture d'une liste — la dette N+1 sans propriétaire fait diverger deux consommateurs (medium)

**Deux unités**

- **U-A « enchaînement »** : codifie contre la lecture de liste existante (forme de réponse actuelle, ordre de service actuel).
- **U-B « réordonnancement / flux listes »** : crée la migration `rank` **et/ou** retouche la lecture de liste — pendant que la question ouverte du ticket (« la dette des listes : plafond à 10, chargement N+1, se règle dans quel épic ? ») reste à trancher au slicing.

**Là où elles se heurtent**

1. **Deux stories peuvent chacune créer « la nouvelle migration »** (`0003_rank.sql` vs `0003_order.sql`) — conflit de fichiers de migration et double colonne.
2. **Le contrat de lecture d'une liste n'est figé nulle part** : champs de réponse (données catalogue dénormalisées pour régler le N+1 ?), tri (`rank` asc — et que fait-on des NULL si la pair 1 n'est pas fermée ?). Si U-B change la forme de réponse pour la dette N+1 pendant que U-A code contre l'ancienne : incompatibilité au runtime.
3. La Différée « ordonnancement des épics » laisse les deux stories s'ordonner librement — l'une peut construire avant que l'autre pose `rank`.

**AD proposé (AD-6bis / resserrer AD-2)**

> La migration de `rank` (un fichier, un numéro) et le **contrat de lecture d'une liste** (un point de terminaison unique, tri par `rank` asc, forme de réponse figée et publiée avant toute story consommatrice) sont détenus par **une story nommée au slicing** ; toute autre story consomme ce contrat sans le modifier. La dette N+1 / plafond des 10 listes reste hors phase 1 sauf décision contraire au slicing — et dans ce cas, elle entre dans la story propriétaire du contrat de lecture, jamais dans une story parallèle.

---

## Pair incompatibility 8 : cible native sans chemin Access vs story « correctifs mobiles » (R5) — une app muette ou deux systèmes d'auth (high)

**Deux unités**

- **U-A « épic Access »** : Access authentifie **le navigateur** (cookie `CF_Authorization` post-OTP). Pour un build natif Expo, aucun porteur de preuve n'est défini (pas de navigateur pour la session Access ; un jeton service est possible mais non écrit).
- **U-B « R5 correctifs mobiles »** : cibles 44 px, safe areas, virtualisation — sur les écrans principaux, dont ceux qui aujourd'hui reposent sur l'écran de connexion et `AuthProvider`.

**Là où elles se heurtent**

Le spine est silencieux sur la plateforme porteuse : le diagramme de déploiement montre Pages (web), mais le Structural Seed garde une branche **native** dans `gifCache.ts` et R5 parle d'écrans mobiles. AD-5 exige « aucun écran de connexion dans l'app » (les deux lettres-obéissances sont piégées) :
1. U-B obéit à AD-5 (retire/prive le flux de connexion natif) → l'app native n'a **aucun** moyen de prouver son identité : toutes les routes listes/favoris sont muettes, seuls catalogue et révision hors ligne survivent (AD-1 : « listes déclarées indisponibles »).
2. U-B garde l'écran de connexion natif pour survivre → deux systèmes d'auth cohabitent, la faille exacte de AD-5.

**AD proposé (AD-8 nouveau)**

> **AD-8 (nouveau)** — Phase 1 cible **le build web** (Pages, cookie Access). Les builds natifs, s'ils sont produits, restent **hors périmètre d'authentification** : catalogue et révision hors ligne seulement, listes/favoris déclarés indisponibles conformément à AD-1, aucune route authentifiée appelée (aucun jeton service, aucun écran de connexion). R5 s'applique aux écrans concernés sans introduire de chemin d'auth natif ; un porteur natif (service token Access) est un changement d'épic avec AD au-moins-justifié.

---

## Clôture

**Ce qui tient à l'attaque :** le paradigme propriétaire (AD-1), le refus d'état serveur de séquence (AD-3) et l'interdiction cache-busting (AD-4+R6) survivent aux paires ; aucun test adverse n'a trouvé deux unités légitimes les violant frontalement.

**Ce qui ne tient pas :** chaque AD a laissé une surface adjacente orpheline — l'INSERT (AD-2), les routes non-nommées et le client (AD-5), le mot « Terminer », la porte média unique, la cible native, la propriétaire de l'env et de la migration. Les pairs 1 et 3 touchent des formes de données et une voie d'exécution partagées au cœur du produit : **à fermer (texte d'AD adopté) avant le slicing de Sofia**, sans quoi deux stories de phase 1 construisent chacune correctement un produit non composable.

**Comptage par sévérité :** critical 2 (pairs 1, 3) · high 4 (pairs 2, 4, 6, 8) · medium 2 (pairs 5, 7) · low 0 — total 8.