---
name: Conciliation spines UX → spine
type: reconcile-review
reviewed: architecture-phase-1.md (spine, 2026-10-28) contre EXPERIENCE.md et DESIGN.md (ux-phase-1)
status: review-only
created: '2026-10-28'
---

# Conciliation spines UX → spine

## Verdict global

**Conciliation avec réserves.** La colonne vertébrale porte la structure — propriété des données (AD-1), ordre en D1 (AD-2), enchaînement sans serveur (AD-3), média en lecture seule (AD-4), Access seul (AD-5) — et les quatre points de vérification demandés tombent en grande partie droit. Mais la structure AD est **muette sur les états d'échec et d'attente** que l'expérience promet : l'optimisme local (réordonnancement qui survit à un échec d'écriture, ajout qui attend le retour du réseau) n'a aucun contrat d'architecture derrière. Deux de ces promesses touchent directement les règles AD-1 et AD-2 elles-mêmes : telle qu'écrite, l'expérience ne peut pas tenir sa parole sans soit un amendement du spine, soit une réduction de la promesse UX. À concilier avant slicing.

Points de vérification explicites (portés, non repris ici en détail) :

- Frontière hors ligne (révision continue, listes indisponibles) : portée par AD-1 — **sauf** la promesse d'ajout différé, traitée ci-dessous (écart n° 1).
- Session/état de révision local, aucun appel API, pas de synchronisation : porté (AD-1 + conventions + Deferred).
- Enchaînement : préchargement du geste suivant, « Chargement du geste… », aria-live — aucune implication serveur trouvée ; porté par AD-3 et AD-4.
- Correctif cache (cache-busting interdit) : écrit dans AD-4 ; la règle « chargement à la révélation seulement » reste implicite (écart n° 6).

## Ce qui n'a pas atterri

### 1. Ajout hors ligne : « L'ajout attend le retour du réseau » — contradiction latente avec AD-1

- **Source :** `EXPERIENCE.md:159` (Flow 3, échec) ; cf. `EXPERIENCE.md:56` et `:97` (message « Pas de réseau. Tes listes sont indisponibles »).
- **Gravité : high** — Contradiction potentielle entre deux spines.
- **L'écart :** AD-1 pose la frontière hors ligne : « les listes sont déclarées indisponibles — jamais réconciliées en tâche de fond en phase 1 ». Mais l'expérience promet que l'ajout d'une passe sans réseau **attend le retour du réseau**, c'est-à-dire une intention d'écriture conservée localement puis rejouée. Où vit cette intention (mémoire seule ? stockage durable ?) ? Que se passe-t-il si l'app est tuée, si la liste est supprimée entre-temps, si le rejouement échoue ? Rien de tout cela n'a de propriétaire dans le spine. Un rejouement automatique est une réconciliation en tâche de fond — précisément ce qu'AD-1 interdit.
- **Suggestion :** au choix, expliciter l'un ou l'autre : (a) réduire la promesse UX (message + retap manuel « Réessayer », aucune file) pour coller à AD-1 ; (b) garder la promesse et créer un AD « écriture différée » (portée de l'intention, durée de vie, conflits, rejouement) — ce qui invalide la clause « jamais réconciliées en tâche de fond » telle qu'écrite.

### 2. Réordonnancement : l'échec de sauvegarde n'a pas de contrat (optimisme local + divergence + signal)

- **Source :** `EXPERIENCE.md:75` (« en cas d'échec de sauvegarde, l'ordre reste local et "Ordre non enregistré." s'affiche ») ; `:110` (mode déclaré, ordre mis à jour à l'écran à chaque coup).
- **Gravité : high** — Contrainte comportementale silencieuse que la structure AD a abandonnée.
- **L'écart :** AD-2 porte l'écriture (un appel batch, rangs 1..n à « Terminer », réordonnancement qu'en ligne) mais rien du **comportement d'échec**, qui implique trois obligations d'architecture : (i) état local optimiste — l'écran affiche l'ordre local alors que D1 détient l'ordre (tension assumée avec « un propriétaire par donnée » qu'il faudrait nommer) ; (ii) un signal d'échec de l'appel batch dans le contrat d'API (statut d'échec, corps d'erreur) que la règle actuelle n'exige pas ; (iii) une sémantique de divergence — après « Ordre non enregistré », que devient l'ordre local au prochain rechargement de la liste (écrasement silencieux ? conservé jusqu'à nouvelle tentative ?). Le spine laisse ce trou : l'utilisateur peut perdre son classement sans qu'aucune règle ne le décide.
- **Suggestion :** compléter AD-2 : affichage optimiste local en mémoire ; à l'échec, divergence tolérée, signal « Ordre non enregistré » obligatoire, aucune réconciliation en tâche de fond (AD-1) ; tout rechargement de liste réadopte l'ordre D1 et avertit l'utilisateur — décision à écrire explicitement.

### 3. Persistance durable de l'état de révision entre lancements

- **Source :** `EXPERIENCE.md:103` (stocké localement, sans appel API), `:83-84` (file initialisée, reprise des ratées de la veille), `:167` (Flow 4 : « sa session d'hier a été retenue »).
- **Gravité : medium**
- **L'écart :** AD-1 dit « l'état de révision est local à l'appareil (propriétaire : l'appareil) » mais ne dit jamais qu'il **persiste entre les lancements**. La promesse UX (file reconstituée le lendemain à partir des votes de la veille, reconstitution après fermeture en cours de session, `.geste indisponible» retirant la passe de la file définitivement — `EXPERIENCE.md:88`) exige un stockage durable local, pas un état d'écran ni un provider mémoire. Sans convention, une implémentation mémoire seulement « vérifie » AD-1 et rate la promesse.
- **Suggestion :** convention (State & cross-cutting) : l'état de révision (dates, votes, exclusions « geste indisponible ») survit au redémarrage de l'app ; stockage local durable (AsyncStorage ou fichier natif), jamais mémoire seule ; contenu non lisible par le Worker.

### 4. Frontière média hors ligne : « Un geste pas encore chargé ne s'affichera pas »

- **Source :** `EXPERIENCE.md:90` (hors ligne, Réviser/Session), `:193` (natif : « le cache fichier des gestes y fonctionne déjà, contrairement au web »).
- **Gravité : medium**
- **L'écart :** AD-4 parle de lecture, préchargement et cache-busting, mais pas du comportement hors réseau : en hors-ligne, un geste ne se joue que s'il est déjà cachelé (natif : file cache ; web : cache navigateur, non garanti). La promesse UX dépend de cette frontière, et elle est asymétrique selon la plateforme — un fait d'architecture que le spine ne note pas.
- **Suggestion :** compléter AD-4 d'une ligne : hors ligne, aucun re-téléchargement ; un geste ne se joue que depuis le cache (natif : garanti ; web : meilleur effort) — la dégradation est « Geste indisponible », pas une erreur réseau.

### 5. « Déconnexion » et identité sous Access : sémantique non portée

- **Source :** `EXPERIENCE.md:33` (Profil : « Identité, déconnexion, mentions »), `:20` (aucun écran de connexion après migration).
- **Gravité : medium**
- **L'écart :** AD-5 supprime les routes `/api/auth/*` à mots de passe et fait d'Access la seule autorité, mais le produit garde une action « déconnexion » et un affichage d'identité. Que fait « déconnexion » quand l'authentification se déroule avant l'app (redirection logout Access ? purge d'un cookie de zone ?) et d'où vient l'identité affichée (réclamations du JWT Access) ? Le spine ne tranche rien — et l'ancienneté du modèle JWT maison rend l'écart probable.
- **Suggestion :** compléter AD-5 : déconnexion = sortie de session Access (URL d'application Access), pas un point de terminaison Worker ; identité affichée lue des réclamations du JWT Access.

### 6. « Aucune lecture du geste avant la révélation » : vraie règle, jamais écrite côté architecture

- **Source :** `EXPERIENCE.md:67`, `:111`, `:186` (anti-pattern « lecture automatique en navigation ») ; `DESIGN.md:161` (« Une seule lecture à la fois, lancée d'un tap explicite »).
- **Gravité : low**
- **L'écart :** AD-4 liste la rafale de N gestes dans ses Prevents mais sa Rule ne l'interdit jamais formellement : rien n'empêche une implémentation de précharger les vignettes d'un catalogue ou d'une liste dès l'ouverture. La discipline (chargement seulement à la révélation ou au lancement explicite d'un enchaînement, une seule lecture à la fois) est le vrai contrôle du poids média (16,8 Mo/GIF) et mérite d'être écrite.
- **Suggestion :** ajouter à la Rule d'AD-4 : aucun chargement de média hors révélation (session, fiche) ou lancement explicite (enchaînement) ; jamais plus d'une lecture en cours.

### 7. Session et enchaînement en écrans pleins, une seule profondeur de modale

- **Source :** `EXPERIENCE.md:41` (« la session de révision et l'enchaînement ne sont pas des modales… pour que le retour du navigateur et le retour Android les quittent proprement »), `:108` (le retour conserve la progression).
- **Gravité : low**
- **L'écart :** obligation de structure de navigation (routes plein écran hors groupe tabs, une seule modale à la fois, session/enchaînement quittables par le retour natif) implicite dans l'expérience ; le spine ne porte aucune convention de navigation, et le Structural Seed ne la suggère pas.
- **Suggestion :** convention (State & cross-cutting ou naming) : session et enchaînement sont des routes plein écran hors `(tabs)` ; profondeur de modale limitée à 1 ; le retour natif quitte session/enchaînement sans détruire l'état local.

## Récapitulatif

| # | Écart | Localisation | Gravité | Cible suggérée |
|---|---|---|---|---|
| 1 | Ajout hors ligne « attend le retour du réseau » | EXPERIENCE.md:159 | high | AD-1 (amender) ou nouvel AD écriture différée |
| 2 | Échec du réordonnancement : optimisme local + divergence + signal | EXPERIENCE.md:75, :110 | high | AD-2 (compléter) |
| 3 | Persistance durable de l'état de révision | EXPERIENCE.md:83, :103, :167 | medium | convention State & cross-cutting |
| 4 | Frontière média hors ligne (natif/web) | EXPERIENCE.md:90, :193 | medium | AD-4 (compléter) |
| 5 | Déconnexion/identité sous Access | EXPERIENCE.md:33, AD-5 | medium | AD-5 (compléter) |
| 6 | Aucune lecture hors révélation, une seule lecture | EXPERIENCE.md:111, :186 ; DESIGN.md:161 | low | AD-4 (Rule) |
| 7 | Écrans pleins, profondeur de modale 1 | EXPERIENCE.md:41, :108 | low | convention navigation |

**Décompte par gravité :** critical 0 · high 2 · medium 3 · low 2.