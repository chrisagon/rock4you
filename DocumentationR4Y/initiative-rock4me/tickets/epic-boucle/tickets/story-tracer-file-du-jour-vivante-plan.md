---
title: 'Tracer : file du jour vivante (epic-boucle / story 1.1)'
type: 'feature'
ticket: '1'
created: '2026-10-29'
status: done
baseline_revision: '19f81168e5ae84bd8e994dda54fa1b7a972637af'
route: 'full'
route_source: 'auto'
risk: 'medium'
review: 'quick'
review_source: 'pinned'
lenses_ran: ['quick']
review_loop_iteration: 0
context: ['{project-root}/DocumentationR4Y/initiative-rock4me/tickets/epic-boucle/epic-boucle.md', '{project-root}/DocumentationR4Y/initiative-rock4me/ux-phase-1/EXPERIENCE.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** l'application montre le catalogue mais rien n'aide à mémoriser : pas de file du jour, pas de session de révision ; la story 1.1 ouvre la voie la plus fine à travers toutes les couches de l'épic (état local durable → file dérivée → onglet Réviser → session révélée).

**Approach:** un `ReviewContext` local-durable (motif des contexts existants, persisté via AsyncStorage), un onglet Réviser en première position avec l'en-tête de file, une session plein écran hors onglets où le geste se révèle au tap via `GifPlayer`, un bouton d'avance jetable fait progresser la file, un état de fin minimal.

## Boundaries & Constraints

**Always:**
- L'état de révision ne vit qu'en local (AD-1, AD-8 web-first) : survit au rechargement, jamais mémoire seule, opaque au serveur — aucun appel réseau dans la boucle.
- La file du jour exclut les passes sans geste : `.filter(m => m.hasGif && m.driveLink)`.
- UI en français, tutoiement ; cibles ≥ 44 px ; palette et conventions des spines UX (DESIGN.md/EXPERIENCE.md : `surface-base #1A1A1A`, accent `#FF6B35`, nom de passe jamais tronqué).
- Session = route plein écran hors `(tabs)` ; le retour conserve la progression.
- Les gardes `Platform.OS === 'web'` de `utils/gifCache.ts` restent intouchées.

**Never:**
- Pas d'écriture serveur, pas de toucher `worker/**`, `data/danceMoves.ts`, `services/api.ts`, les fichiers sales préexistants (`git status` hors `DocumentationR4Y` et fichiers créés ici).
- Pas d'auto-évaluation, pas de votes, pas de compteur de sues (story 3) ; pas de composition J+1 ni « Réviser librement » ni re-constitution après une session finie (story 4) — un état de fin texte seul suffit ici.
- Pas de fusion Accueil/Recherche → Catalogue (changement IA hors cette story, à tracer en suivi) ; on accepte 5 onglets en transitoire.
- Pas de modification interne de `GifPlayer`/`gifCache` (cache-busting retiré à la story 2).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Premier lancement | aucun état local | file dérivée : 12 premières passes jouables dans l'ordre du catalogue [HYPOTHÈSE] ; « 12 passes à revoir » | aucune |
| Rechargement | état existant | même file reprise, même carte en cours | aucune |
| Révélation | tap sur le cadre | geste chargé à la demande et joué en boucle ; état « Chargement du geste… » natif de GifPlayer | GifPlayer indisponible si !hasGif |
| Dernière carte | bouton d'avance sur la 12ᵉ | écran de fin « C'est fini pour aujourd'hui. » + retour à Réviser | aucune |
| Retour en session | appui retour navigateur/Android | quitte la session, progression conservée | aucune |

</frozen-after-approval>

## Code Map

- `contexts/FavoritesContext.tsx` — motif à copier : `createContext<T | undefined>` (:14) + `useState` + hook exporté (`useFavorites` :128-134), monté global dans `app/_layout.tsx:20-28`.
- `app/_layout.tsx` — Stack `headerShown: false` (:23-25), `initCacheSystem()` en `useEffect` (:12-17) : monter `ReviewProvider` ici, jamais dans `(tabs)` (la session est hors onglets).
- `app/(tabs)/_layout.tsx` — onglets (:44-79, icônes lucide, barre noire active `#FF6B35`) : ajouter l'onglet Réviser en première position, garde d'auth :11-27 intouchée.
- `app/(tabs)/index.tsx` — squelette d'écran à imiter : `SafeAreaView` (:149), en-tête interne (:151-153), StyleSheet local (:304-510) ; son contenu (grille, filtres) reste ; il devient l'« Accueil » transitoire.
- `components/GifPlayer.tsx` — réutilisé tel quel : props `move/isPlaying/size='responsive'` (:6-15), placeholder indisponible (:66-69), `getImageSource` buste (`?t=`, :199-207) — ne pas modifier (story 2).
- `data/danceMoves.ts` — lecture seule : `danceMoves` (:24), `DanceMove` (:1-22), `getGifUrl` (:5398), `levels` (:5396) ; carte : `movementName`, `family` (fallback « Non classée »), `level`, `hasGif && driveLink`.
- `app/(auth)/login.tsx` — exemple d'écran plein présentationnel : `<View>` pleine page sombre, StyleSheet local, `router` (:24, :91).
- `utils/gifCache.ts` — gardes web :25, 65, 120, 149, 179, 203, 225 à préserver.

## Tasks & Acceptance

**Execution:**
- [ ] `package.json` -- `npm i @react-native-async-storage/async-storage` (persiste le même état partout, web compris ; convention spine) -- le seul ajout de dépendance du run.
- [ ] `contexts/ReviewContext.tsx` -- créer le provider : état `{ fileDuJour: string[] (ids), carteIndex, dernierLancement, terminé : boolean }` persisté AsyncStorage (clef `rock4me.review.v1`), dérivation de la file au premier lancement (12 premières jouables, ordre catalogue [HYPOTHÈSE]), `avancer()` jetable, hook `useReview()` — copier le motif FavoritesContext -- AD-1 : durable, opaque au serveur.
- [ ] `app/_layout.tsx` -- monter `ReviewProvider` à côté des providers existants -- disponibilité sous onglets ET hors onglets.
- [ ] `app/(tabs)/_layout.tsx` -- ajouter l'onglet Réviser en première position (icône lucide `BookOpen`, titre « Réviser ») -- l'IA de la spine place Réviser onglet 1 ; les 5 onglets restent jusqu'à la fusion Catalogue (hors story).
- [ ] `app/(tabs)/revise.tsx` -- créer l'écran : en-tête de file (« N passes à revoir »), bouton « Commencer » (cible 44 px) vers la session ; état vide « Rien à revoir aujourd'hui. » (sans « Réviser librement », story 4) -- le squelette copie `app/(tabs)/index.tsx` (SafeAreaView + en-tête sombre interne + StyleSheet local).
- [ ] `app/session-revision.tsx` -- créer la session : carte (nom en `title` jamais tronqué, famille « Non classée » si vide + niveau en méta), cadre du geste : bouton « Touche pour révéler » jusqu'au tap puis `GifPlayer` en boucle (props du Code Map), bouton jetable « Suivante » 44 px (retiré à la story 3), retour `router.back()` -- la sortie conserve la progression.
- [ ] `DocumentationR4Y/initiative-rock4me/` -- (aucune écriture : tickets/glossaire gérés par Sofia ; le plan note la suite) -- le chemin de la fusion Accueil+Recherche → Catalogue est tracé dans Implementation Notes pour la mise en file d'un suivi.

**Acceptance Criteria:**
- Given un premier lancement (état local vide), when j'ouvre l'App, then Réviser affiche « 12 passes à revoir » et « Commencer ».
- Given la session ouverte et le geste masqué, when je touche le cadre, then le geste se charge puis tourne en boucle.
- Given le dernier écart de state (carte 12, advance), when j'avance, then « C'est fini pour aujourd'hui. » s'affiche et le retour mène à Réviser.
- Given un rechargement après une carte avancée, when je rouvre, then la file reprend sur la même position.
- Given 12 passes de la file exclues des 29 non jouables, when la file se dérive, then aucune passe sans geste n'apparaît.

## Implementation Notes

(fusion Accueil+Recherche → Catalogue : hors story, à mettre en file d'attente chez Sofia — c'est un changement IA de la spine, pas du ménage ; la fusion remettra l'app à 4 onglets.)

- 2026-10-29 — Implémentation : `@react-native-async-storage/async-storage@2.1.2` ajoutée par vendoring manuel (npm pack + tgz dans node_modules + entrées de lock) : le poste refuse `npm i` (ETARGET sur `expo-file-system@~16.1.2`, registry métadonnées tronquées) ; un `npm ci` propre reste cassé en dehors de cette story — préexistant, à régler hors épic.
- 2026-10-29 — Typegen typed-routes : `npx expo start --clear` headless régénère `router.d.ts` (`/session-revision`, `/(tabs)/revise`) ; nécessaire pour le tsc du run.
- 2026-10-29 — « Chargement du geste… » (libellé exact de la spine) : porté en deferred-work.md à la story 1.2 (surface du player).
- 2026-10-29 — Patches de revue (1re pass, quick) : clamp de `carteIndex` au chargement, `console.warn` sur échec d'écriture, `ScrollView` dans la colonne de session (carte ≥ 60 % conservée via `flexGrow: 1`, `paddingBottom: 40`).

## Plan Change Log

## Review Triage Log

- Pass 1 (lentille quick, 2026-10-29) — 5 trouvailles : high 0, medium 2, low 3, false 0, maybe-false 0.
  - `app/session-revision.tsx:60-68` + `components/GifPlayer.tsx:209-216,304-310` — « Chargement du geste… » absent (logo + spinner natifs, texte uniquement en retry). Verdict **low** : l'affordance de chargement existe, seul le libellé exact de la spine manque ; la surface du player appartient à la story 1.2 (GifPlayer intouché ici, frontière du plan). Route : **defer**.
  - `app/session-revision.tsx:70-77` — aria-live et clavier (espace/Entrée révèle) absents de l'écran. Verdict **medium** : le défaut est réel dans le code actuel, mais la story 1.3 (approuvée dans la voie de l'épic) les porte explicitement, et le sweep 1.5 revérifie le plancher d'accessibilité. Route : **defer** (à la story 1.3).
  - `contexts/ReviewContext.tsx:59-63` — état persisté accepté sans validation (carteIndex/termine de confiance) ; un index négatif ou hors bornes affiche un compte faux et une fin « C'est fini » en milieu de file, de façon permanente. Verdict **low** : le programme seul ne peut pas atteindre l'état corrompu (seul `avancer()` dans les bornes écrit l'index), mais la correction est une ligne (clamp au chargement). Route : **patch**.
  - `contexts/ReviewContext.tsx:92` — échec d'écriture de stockage avalé en silence (`.catch(() => {})`) : progression perdue sans signal (quota, navigation privée). Verdict **low** : rare au quotidien ; le plus petit correctif est un `console.warn` (visibilité développeur sans UX nouvelle). Route : **patch**.
  - `app/session-revision.tsx:107-119,54-87` — pas de conteneur défilable : à grande taille de police système, le contenu dépasse la colonne fixe et « Suivante » sort d'atteinte ; le plancher « la carte grandit au lieu de couper » (EXPERIENCE.md:125) est cassé. Verdict **medium** : réel pour les utilisateurs à police agrandie ; le correctif est un `ScrollView` dans la colonne, sans nouvelle surface. Route : **patch**.

## Design Notes

- La session reste hors `(tabs)` et plein écran : le retour natif quitte proprement (convention navigation de la spine d'architecture).
- Persistance : AsyncStorage couvre web (localStorage) et natif (KV natif) ; la clef `rock4me.review.v1` versionne le schéma tôt.
- Le bouton d'avance jetable est délibéré : la file doit se dérouler et se démontrer sans les votes (story 3) ; il est retiré là, pas au sweep.

## Verification

**Commands:**
- `npx tsc --noEmit` (racine) -- expected: aucune erreur NOUVELLE (baseline ~14 erreurs préexistantes documentées dans AGENTS.md, dont `utils/gifCache.ts` et `components/Section.tsx`) ; comparer le décompte.
- `npx expo start --clear` puis navigateur -- expected: onglet Réviser vivant, session jouable selon l'I/O matrix.

**Manual checks (si pas de CLI):**
- Rechargement du navigateur : la position de la file est conservée.
- Outils du web (onglet Réseau) : la première révélation télécharge le GIF une fois ; la boucle qui suit rejoue le même `src` sans nouvelle requête. (À cette story les requêtes portent encore `?t=…` — le retrait du cache-busting est la story 2 ; on constate, on ne corrige pas.)