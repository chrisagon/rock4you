# Conciliation ticket + brief → spine

**Sources relues :** `initiative-rock4me.md` (R1–R6, contraintes C1–C3, boundaries, notes), brief `brief-memorisation-des-passes.md` (§La solution A–E, §Critères de succès, §Périmètre, §Risques), `addendum.md` (§1 mesures, §3 options, §4 dette, §5 pour la file du jour).
**Objet :** ce qui du ticket et de ses sources n'a **pas** atterri dans `architecture-phase-1.md` — ni dans un AD, ni dans les conventions, ni dans la Capability → Architecture Map, ni en Deferred. Ce qui a atterri n'est pas restitué ici (AD-1 à AD-5, rang en D1 et batch « Terminer », Access seule autorité, préchargement un-davance, migrations en ordre de fichier, `EXPO_PUBLIC_API_URL` vers la zone possédée, schéma multi-utilisateurs conservé, GIF seuls masters, catalogue et recherche intouchés, ordre des épics au slicing).

## Verdict global

Le spine est fidèle sur ses quatre invariants porteurs (un propriétaire par donnée, l'ordre en D1, l'enchaînement sans serveur, Access seule autorité), mais **cinq charges discrètes ne sont portées nulle part**, dont une **contradiction interne** : le diagramme prod promet « cache immuable » sur `r2.dev` alors que l'addendum mesure l'absence de `Cache-Control` sur cet endpoint — le critère R6 (« servie une fois par navigateur ») peut être invérifiable en phase 1. Côté Access, le spine traite le web et laisse le **client natif** sans mécanisme d'obtention du JWT. La règle « passe sans geste » (exclue en révision, sautée avec mention, jamais bloquante) et l'URL 404 mesurée n'apparaissent nulle part alors qu'un done-when en dépend. La file du jour (ordonnancement, plafond), l'hypothèse wifi assumée et la dette listes (plafond 10, N+1) manquent à l'appel, en convention ou en Deferred. Aucune restructuration : ~2 lignes de plus en AD/convention et ~5 en Deferred suffisent.

## Ce qui n'a pas atterri

### critical

1. **« Cache immuable » sur `r2.dev` : contradiction interne, R6 potentiellement invérifiable** — `critical`
   - **Où ça manque :** spine, diagramme prod (l.121) : `R2 : GIF r2.dev en phase 1` avec l'arête `lecture publique / cache immuable` ; AD-4 reste muet sur les en-têtes de diffusion ; Deferred (l.153) repousse le domaine R2 personnalisé après la phase 1.
   - **Source :** addendum §1 : « pas de domaine personnalisé, pas de `Cache-Control` observé » sur `pub-*.r2.dev` ; ticket R6 et done-when « une passe révélée n'est re-téléchargée qu'une fois par navigateur, vérifié dans les outils du web » ; critère de succès « puis servie par le cache ».
   - **Charge perdue :** en phase 1, la diffusion choisie (`r2.dev`) ne porte pas les en-têtes qui rendent le critère R6 tenable ; le diagramme affirme une immuabilité non mesurée, et l'unique levier (domaine de zone) est explicitement différé. Le done-when peut échouer sans que rien dans le spine ne le signale.
   - **Ligne proposée (caveat AD-4 ou Deferred) :** « Diffusion phase 1 : `r2.dev` ne sert pas de `Cache-Control` (addendum §1) ; si le critère R6 ("servie une fois par navigateur") ne tient pas sur cet endpoint, activer un domaine de zone pour les GIF **dans l'épic R6** plutôt que d'attendre le pipeline média différé — corriger sinon le libellé "cache immuable" du diagramme. »

### high

2. **Authentification du client natif sous Access : absent du spine** — `high`
   - **Où ça manque :** spine AD-5 (l.73–77 : « chaque requête porte le JWT d'Access (en-tête `cf-access-jwt-assertion` ou cookie) ») et diagramme prod (l.117–121 : flux `utilisateur → APP Pages` uniquement côté web, OTP navigateur). La Capability Map R3 ne voit que « Access + middleware Worker ».
   - **Source :** ticket R3 (l.33–34 : « Cloudflare Access authentifie avant l'application ») ; le produit cible le mobile (RN natif), où ni le challenge OTP navigateur ni le cookie `CF_Authorization` n'arrivent tout seuls, et où `cf-access-jwt-assertion` est injecté par Access côté edge, pas posé par le client.
   - **Charge perdue :** le mécanisme par lequel l'app native obtient et renvoie la preuve Access (OTP via navigateur intégré + renvoi du JWT, ou service token Access) n'est nommé nulle part ; sans lui, l'épic Access réussit sur le web et échoue sur la plateforme primaire.
   - **Ligne proposée (Deferred, avec AD conditionnel) :** « Transport du JWT Access dans le client natif (OTP via navigateur intégré puis renvoi du jeton, ou service token Access) : à trancher dans l'épic Access ; si un second canal de preuve (service token) coexiste avec l'OTP, un AD au-moins-justifié est requis. »

3. **Passe sans geste : exclue en révision, sautée avec mention en enchaînement — et l'URL 404 mesurée** — `high`
   - **Où ça manque :** spine, Capability Map R1/R4 (l.142, l.145), AD-2/AD-3/AD-4 et conventions : aucune trace de la règle de jouabilité ; le schéma Structural Seed ne mentionne pas `hasGif` comme contract du catalogue.
   - **Source :** ticket R1 (l.30 : « Les passes sans geste ne sont jamais proposées ») et R4 (l.36 : « une passe sans geste est sautée avec une mention, jamais bloquante ») ; critère de succès (brief l.55) ; addendum §1 : 19 passes sans URL, 10 avec URL mais `hasGif: false`, et **une URL listée répond 404** (`51 Clé de bras infinie.gif`).
   - **Charge perdue :** le done-when « une liste se joue de bout en bout sans nouvelle action » dépend d'une règle silencieuse de saut ; sans elle, la passe 404 ou sans geste bloque la lecture séquentielle. La donnée (29 passes non jouables + 1 URL morte) a un poids d'architecture que ni AD ni convention ne porte.
   - **Ligne proposée (convention « Data & formats ») :** « Le catalogue embarqué est l'unique juge de jouabilité (`hasGif`) : la révision n'propose jamais une passe sans geste ; l'enchaînement la saute avec une mention, comme toute URL morte (404 mesurée, addendum §1) — jamais bloquante. »

### medium

4. **File du jour : ordonnancement (ancienneté + taux d'échec), plafonnement, sans ordonnanceur** — `medium`
   - **Où ça manque :** spine, Capability Map R1 (l.142 : « client + état local », rien de plus) ; AD-1 ne parle que de continuité hors réseau ; le diagramme (l.30 : « état de révision local (dates, votes) ») effleure le stock sans porter la règle de dérivation ni le plafond.
   - **Source :** ticket R1 (l.30 : « file du jour plafonnée ») ; brief §La solution A (l.37 : « ordonnée par ancienneté de révision et par taux d'échec ») ; addendum §5.2 : « sans ordonnanceur formel ».
   - **Charge perdue :** l'ordre de la file détermine la forme du stock local (dernière date de révision **et** historique des votes pour dériver un taux d'échec) ; rien dans le spine n'exige cette mécanique, ni le plafond de la file.
   - **Ligne proposée (convention « State & cross-cutting ») :** « La file du jour est dérivée de l'état local (ancienneté de révision + taux d'échec des votes), plafonnée, sans ordonnanceur formel ni écriture serveur (addendum §5.2) ; le stock local doit porter les champs de cette dérivation. »

5. **Dette listes : plafond à 10 et chargement N+1 — open question du ticket sans ligne Deferred** — `medium`
   - **Où ça manque :** spine, Deferred (l.149–155) : rien ; AD-2 couvre l'écriture d'ordre, pas la lecture de listes ; Structural Seed muet.
   - **Source :** ticket Notes (l.78 : « la dette des listes (plafond à 10, chargement N+1, addendum §4) se règle dans quel épic… ») ; addendum §4 : « `GET /api/lists` plafonne à 10 par défaut côté serveur ; le client n'envoie pas de `limit` » et « le chargement des playlists fait une requête par playlist après la liste ».
   - **Charge perdue :** l'enchaînement lit une liste via l'API (AD-3) ; son épic découvre mécaniquement ce plafond et ce N+1. L'open question du ticket (quel épic, ou hors phase 1) attend le slicing mais le spine ne l'a pas capturée — risque d'être redécouverte en cours d'implémentation.
   - **Ligne proposée (Deferred) :** « Dette listes : plafond à 10 de `GET /api/lists` (défaut serveur, client sans `limit`) et chargement N+1 des playlists (addendum §4) — open question du ticket, à trancher au slicing ; l'épic enchaînement, qui lit une liste via l'API, la découvre de fait. »

6. **Hypothèse wifi assumée (C1) : jamais énoncée dans les invariants** — `medium`
   - **Où ça manque :** spine AD-4 (l.67–71) cite le poids par GIF (16,8 Mo) comme taille du problème, mais ni la contrainte d'usage « wifi assumé, pas résolu en phase 1 », ni le chiffre agrégé d'enchaînement (~84 Mo pour cinq passes, addendum §1) n'apparaissent — ni en convention, ni en Deferred.
   - **Source :** ticket C1 (l.44) ; brief §Risques (l.72 : « Conséquence assumée : la révision et l'enchaînement se pratiquent en wifi, pas en mobilité data, jusqu'au pipeline média »).
   - **Charge perdue :** AD-4 ressemble à une optimisation alors qu'il borne un compromis assumé (l'usage mobile data reste hors d'atteinte en phase 1) ; sans la ligne, un lecteur peut croire qu'AD-4 « règle » le poids.
   - **Ligne proposée (Deferred) :** « Hypothèse wifi assumée (C1) : un enchaînement de cinq passes charge ≈ 84 Mo (addendum §1) ; révision et enchaînement se pratiquent en wifi jusqu'au pipeline média — conséquence supportée en phase 1, pas une exigence de performance. »

### low

7. **Données familles/niveau : complétion à la main (219 passes) et axe niveau incohérent** — `low`
   - **Où ça manque :** spine, Capability Map R2 (l.143 : « catalogue embarqué (données) ») — la charge de données et son risque ne sont capturés ni en convention ni en Deferred.
   - **Source :** brief §Risques (l.73 : « 219 passes à classer relèvent du jugement, pas du script. Risque de rester à moitié fait ») ; ticket R2 (l.32) ; addendum §4 : difficulté 1–2 en données alors que l'interface propose 1–5 (les filtres niveau 3–5 renvoient vide) ; tri de recherche inopérant (§4), adjacent aux filtres R2.
   - **Charge perdue :** le critère « toutes les passes ont une famille ou « non classée » » est un travail de données à l'humain, avec des incohérences d'axe qui affaiblissent les filtres R2 ; le spine ne garde aucune trace du risque.
   - **Ligne proposée (Deferred) :** « Données familles : 219 passes à classer à la main (risque "à moitié fait", brief) + niveau incohérent (interface 1–5, données 1–2) et tri de recherche inopérant (addendum §4) ; travail de données et de client, propre à l'épic familles. »

8. **Notifications absentes de la liste Deferred (C2)** — `low`
   - **Où ça manque :** spine, Deferred (l.155 : « SRS, historique/partage/miroir ») — pas de « notifications ».
   - **Source :** ticket C2 (l.45 : « pas de partage public, pas de notifications ») ; brief hors phase 1 (l.66).
   - **Charge perdue :** mineure : la liste des exclusions explicites du ticket est incomplète dans le spine, d'où un risque de réintroduction accidentelle.
   - **Ligne proposée (Deferred) :** ajouter « notifications » à la ligne « SRS, historique/partage/miroir : reportés au brief ; rien ne se construit pour. »

9. **Migration Pages → Workers static assets : déclarée « différé, pas abandonné », seulement en parenthèse** — `low`
   - **Où ça manque :** spine, Stack (l.97 : précision entre parenthèses) — absente de la liste Deferred ; et le diagramme prod (l.119) marque encore « Pages (hostname zone) » sans lien avec la bascule.
   - **Source :** brief §Hébergement (l.33) et §Différé (l.68 : « au prochain déploiement, pas un chantier ») ; ticket Boundaries (l.61 : Cloudflare Access et déploiement Pages sans épic).
   - **Charge perdue :** la bascule des deux hostnames (app et API) vers la zone possédée est le terrain de l'épic Access ; la porter uniquement en parenthèse de Stack lui fait perdre son rattachement opérationnel.
   - **Ligne proposée (Deferred) :** « Migration Pages → Workers static assets au prochain déploiement ("différé, pas abandonné", brief) : les deux hostnames (app + API) basculent sur la zone possédée dans l'épic Access ; le diagramme prod mentionne encore "Pages (hostname zone)". »

---

*Critique-relecture uniquement : rien de ce qui a atterri n'est restitué ; ce document n'engage pas le spine, il liste les charges à recapturer au prochain rafraîchissement (avant le slicing, comme le demande le ticket l.71).*