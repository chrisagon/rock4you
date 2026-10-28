---
name: Rock4me
status: final
sources:
  - ../brief-memorisation-des-passes/brief-memorisation-des-passes.md
  - ../brief-memorisation-des-passes/addendum.md
updated: 2026-10-28
---

# Rock4me — Spine d'expérience

> Phase 1 : boucle de révision, familles, accès, enchaînement. Mobile d'abord, desktop secondaire. Les deux spines priment sur toute maquette ou wireframe en cas de conflit.

## Foundation

Web mobile en priorité (375 à 430 px), desktop secondaire, et la même expérience dans l'application native Expo. Aucun système de design nommé : React Native `StyleSheet` et `lucide-react-native`, sur un thème sombre. `DESIGN.md` porte l'identité visuelle ; ce document porte le comportement. Interface en français, tutoiement.

Vocabulaire, sans synonymes : une **passe** est une entrée du catalogue ; son **geste** est la démonstration animée ; une **carte** est un élément de liste ; une **fiche** est l'écran de détail ; la **file du jour** est ce qu'il reste à réviser ; une **session** est le parcours de la file ; un **enchaînement** est la lecture des passes d'une liste, l'une après l'autre, pour composer une chorégraphie ; une **lecture** est un déroulement en cours : celui d'un geste révélé, ou celui d'un enchaînement. Le mot GIF ne désigne que le fichier, jamais le contenu.

[HYPOTHÈSE] Après migration vers Cloudflare Access, il ne reste aucun écran de connexion, d'inscription ou de réinitialisation dans le produit : l'authentification se fait avant l'application.

[HYPOTHÈSE] L'enchaînement et le réordonnancement des passes dans une liste entrent en phase 1 à la demande de l'utilisateur ; le brief ne les porte pas.

## Information Architecture

| Surface | Atteinte depuis | Rôle |
|---|---|---|
| Réviser | Onglet 1 | File du jour, nombre de passes sues, lancement de session |
| Session de révision | Réviser, puis « Commencer » | Une carte à la fois : nom, révélation, auto-évaluation |
| Catalogue | Onglet 2 | Parcourir, filtrer, rechercher une passe |
| Fiche passe | Tap sur une carte de liste | Métadonnées, geste, ajout à une liste |
| Favoris | Onglet 3 | Listes personnelles, passes favorites, réordonnancement et enchaînement |
| Profil | Onglet 4 | Identité, déconnexion, mentions |

Barre d'onglets à quatre entrées : **Réviser · Catalogue · Favoris · Profil**. [HYPOTHÈSE] Les écrans « Accueil » et « Recherche » fusionnent dans Catalogue : champ de recherche en haut, filtres dans une feuille. Cinq onglets sur 375 px sont trop serrés, et les deux écrans montraient déjà la même liste.

Profil ne porte aucune action de révision : identité, déconnexion, mentions. Il n'apparaît dans aucun flux, et c'est assumé.

Chaque liste de Favoris porte deux actions d'en-tête : « Réordonner », qui ouvre un mode de classement des cartes, et « Enchaîner », qui lance l'enchaînement de cette liste.

Modales : une seule profondeur, jamais deux. La session de révision et l'enchaînement ne sont pas des modales : ce sont des écrans pleins, pour que le retour du navigateur et le retour Android les quittent proprement.

## Voice and Tone

Microcopy. La voix de marque vit dans `DESIGN.md` (Brand & Style).

| Écrire | Ne pas écrire |
|---|---|
| « 12 passes à revoir » | « C'est parti pour une session ! » |
| « Geste masqué. Touche pour révéler. » | « Cliquez ici pour afficher le contenu » |
| « Passe 2 sur 5 » | « Lecture en cours… » |
| « Fin de l'enchaînement. » | « On rejoue ? » |
| « Pas de geste : {nom}. » | « Certaines passes ont été ignorées » |
| « C'est fini pour aujourd'hui. » | « Bravo, tu as tout déchiré ! 🎉 » |
| « 29 passes n'ont pas de geste. » | « Certaines données sont manquantes » |
| « Pas de réseau. Tes listes sont indisponibles ; tu peux quand même réviser. » | « Erreur de connexion (500) » |

Pas d'emoji, pas de point d'exclamation, pas d'encouragement. Une phrase dit l'état, la suivante dit quoi faire.

## Component Patterns

Comportemental. Les specs visuelles vivent dans `DESIGN.md.Components` ; les composants qui n'y figurent pas sont comportement-only et reprennent les jetons voisins.

| Composant | Usage | Règles de comportement |
|---|---|---|
| En-tête de file | Réviser | Affiche « N passes à revoir » et, en second, le nombre de passes sues. Se met à jour à chaque vote, sans animation. |
| Carte de révision | Session | Nom en entier, famille et niveau en méta. Le geste reste masqué jusqu'au tap. Aucune lecture avant révélation. |
| Bouton de révélation | Session | Occupe l'emplacement du geste. Après révélation, disparaît au profit de la barre d'auto-évaluation ; le geste se joue alors en boucle. |
| Barre d'auto-évaluation | Session, après révélation | Trois boutons : À revoir, Hésité, Su. Ces libellés qualifient le geste, pas la passe. Un vote avance immédiatement à la suivante, sans confirmation. |
| Bouton Passer | Session, après révélation | Avance sans voter ; la passe reste dans la file du jour. Même cible de 44 px que les votes. |
| Carte de passe | Catalogue, Favoris | Ouvre la fiche. Le cœur et l'ajout à une liste sont des cibles de 44 px, jamais une icône nue. |
| Bouton Enchaîner | En-tête d'une liste, Favoris | Lance l'enchaînement de cette liste. Cible de 44 px, une seule par liste ; il ne s'affiche pas si la liste n'a aucune passe jouable. |
| Carte d'enchaînement | Écran d'enchaînement | Nom en entier, famille et niveau en méta ; le geste se joue en boucle dès l'arrivée, il n'est jamais masqué. |
| Barre de lecture | Écran d'enchaînement | Compteur « Passe 2 sur 5 » en méta, puis trois cibles de 44 px : Précédente, Pause/Reprise, Suivante. Précédente reste désactivée sur la première passe. |
| Mode Réordonner | En-tête d'une liste, Favoris | Chaque carte porte alors deux cibles de 44 px, monter et descendre ; l'ordre se met à jour à l'écran à chaque coup. « Terminer » ferme le mode et sauvegarde l'ordre ; en cas d'échec de sauvegarde, l'ordre reste local et « Ordre non enregistré. » s'affiche. |
| Feuille de filtres | Catalogue | Famille, niveau, cours, et « Non classée ». Se ferme sur « Appliquer » ou sur le voile. |
| État vide | Chaque surface | Une phrase d'état, une action. Jamais une illustration seule. |

## State Patterns

| État | Surface | Traitement |
|---|---|---|
| Premier lancement | Réviser | File initialisée avec les 12 premières passes non vues, dans l'ordre du catalogue. [HYPOTHÈSE] |
| Jours suivants | Réviser | [HYPOTHÈSE] La file reprend d'abord les passes ratées ou hésitées la veille, puis complète à 12 avec des passes jamais vues. |
| File vide en début de journée | Réviser | « Rien à revoir aujourd'hui. » puis « Réviser librement », qui pioche dans tout le catalogue. |
| Session terminée | Session | « C'est fini pour aujourd'hui. » avec le nombre de passes vues et le retour à Réviser. Pas de score, pas de série. |
| Révélation en cours | Session | Le cadre affiche « Chargement du geste… ». Le geste apparaît quand il est prêt ; [HYPOTHÈSE] il peut peser 16 Mo en phase 1. |
| Geste introuvable | Session | « Geste indisponible. » La passe sort de la file et n'est plus proposée. |
| Passe sans geste | Partout | Jamais proposée en révision (29 passes exclues). Visible dans le catalogue avec la mention « pas de geste », et famille « Non classée » si elle est vide ; la fiche affiche les métadonnées sans cadre de geste. |
| Hors ligne | Réviser, Session | La file et les votes fonctionnent : le catalogue est embarqué et l'état est local. Un geste pas encore chargé ne s'affichera pas. |
| Enchaînement lancé | Écran d'enchaînement | La première passe s'affiche et se joue aussitôt ; le geste suivant se précharge pendant que l'un tourne. Si le premier geste tarde, « Chargement du geste… » tient la place, comme entre deux passes. |
| Passage à la passe suivante | Écran d'enchaînement | Après deux boucles [HYPOTHÈSE : deux boucles en phase 1, paramètre ajustable], la passe suivante arrive sans transition. Si son geste tarde, « Chargement du geste… » tient la place et l'enchaînement attend. |
| Passe sans geste en enchaînement | Écran d'enchaînement | « Pas de geste : {nom}. » s'affiche un instant, puis la passe suivante enchaîne. L'enchaînement ne bloque jamais au lancement. |
| Pause | Écran d'enchaînement | Le geste gèle sur son image courante ; le compteur et la barre de lecture restent en place. |
| Dernière passe jouée | Écran d'enchaînement | « Fin de l'enchaînement. » avec « Rejouer » et « Retour à la liste ». L'enchaînement ne repart jamais de lui-même. |
| Liste sans passe jouable | Favoris | Le bouton « Enchaîner » ne s'affiche pas ; la liste reste consultable et ordonnable. |
| Hors ligne, listes | Favoris | « Pas de réseau. Tes listes sont indisponibles ; tu peux quand même réviser. » |
| Chargement des listes | Favoris | « Chargement des listes… » tient la place jusqu'au premier retour du service. |
| Échec de chargement des listes | Favoris | « Impossible de charger tes listes. » avec « Réessayer ». |
| Favoris vide | Favoris | « Aucune liste pour l'instant. » puis « Parcourir le catalogue », qui ouvre l'onglet Catalogue. |
| Aucun résultat | Catalogue | « Aucune passe ne correspond. » avec « Effacer les filtres ». |

L'état de révision (dernière date, dernier vote) est stocké **localement** en phase 1, sans appel API. Cela permet de réviser hors ligne et de ne pas rouvrir le chantier d'authentification. [HYPOTHÈSE] Conséquence assumée : pas de synchronisation entre appareils avant la phase suivante.

## Interaction Primitives

- Tap pour révéler, tap sur un vote pour avancer. Aucun balayage horizontal entre deux cartes : le balayage est réservé au retour.
- Le bouton retour quitte la session et conserve la progression ; il ne détruit rien.
- Dans l'enchaînement, la lecture démarre d'un tap explicite sur « Enchaîner » et se conduit avec Précédente, Pause et Suivante ; l'ordre de danse est l'ordre de la liste. Le retour quitte l'enchaînement à tout instant.
- Réordonner est un mode déclaré : les cartes ne bougent jamais en navigation ordinaire.
- Aucune lecture du geste avant la révélation, aucune transition animée entre deux cartes.
- Desktop : barre d'espace ou Entrée révèle, les touches 1, 2, 3 votent. Dans l'enchaînement, la barre d'espace met en pause et reprend, les flèches gauche et droite reculent et avancent. Le survol n'est jamais le seul moyen d'atteindre une action.
- **Interdits** : carrousel, série de jours, badge de notification, lecture infinie, minuteur de session, répétition automatique de l'enchaînement entier.

## Accessibility Floor

Comportemental. Le contraste visuel vit dans `DESIGN.md`.

- Toute cible tactile mesure au moins 44 px, y compris sur le web.
- Chaque action porte un libellé : « Révéler le geste de {nom} », « Marquer {nom} comme su », « Passer {nom} », « Ajouter {nom} à une liste », « Enchaîner les passes de {nom de liste} », « Faire remonter {nom} dans la liste », « Faire descendre {nom} dans la liste », « Mettre {nom} en pause », « Reprendre {nom} », « Revenir à la passe précédente », « Aller à la passe suivante ».
- La révélation, le vote et le passage à la passe suivante sont annoncés par les lecteurs d'écran (`aria-live` sur le web, annonce native ailleurs) ; l'entrée en pause aussi.
- L'information n'est jamais portée par la couleur seule : un niveau s'écrit, il ne se code pas en teinte.
- Ordre de focus identique à l'ordre de lecture ; le focus reste visible sur le web.
- « Réduire les animations » respecté : aucune transition n'est requise pour comprendre l'état.
- Le nom de la passe n'est jamais tronqué : à la plus grande taille de police, la carte grandit au lieu de couper.

## Key Flows

### Flow 1 — La session du mardi soir (Christophe, 22 h, chez lui, en wifi)

1. Christophe ouvre l'application ; Access l'a déjà authentifié.
2. Réviser affiche « 12 passes à revoir » et le nombre de passes sues.
3. Il touche « Commencer ». La première carte montre un nom, une famille, un niveau, et un cadre vide.
4. Il se dit le geste dans sa tête, puis touche le cadre.
5. Le geste se charge, puis se joue en boucle.
6. Il touche « Hésité ». La carte suivante arrive sans transition.
7. **Climax :** à la septième carte, il croyait connaître la passe et découvre qu'il la confondait avec une autre. C'est la première fois que l'application lui montre un manque au lieu de le lui cacher.
8. Après la douzième, l'écran affiche « C'est fini pour aujourd'hui. » et le nombre de passes vues.

Échec : le geste met trop de temps à charger. « Chargement du geste… » reste affiché ; il peut voter sans voir le geste, ou toucher Passer.

### Flow 2 — Retrouver une passe pendant le cours (Christophe, en plein cours, quelqu'un lance une passe qu'il ne nomme pas)

1. Il ouvre Catalogue.
2. Il filtre sur la famille entendue, puis sur le niveau.
3. Il touche la carte qui ressemble au geste.
4. La fiche affiche les métadonnées et le geste en boucle.
5. **Climax :** il reconnaît la passe et peut la nommer à voix haute avant la fin du cours.

Échec : les filtres ne ramènent rien. « Aucune passe ne correspond. » avec « Effacer les filtres ».

### Flow 3 — Ranger une passe dans une liste (Christophe, après le cours)

1. Depuis la fiche d'une passe, il touche « Ajouter à une liste ».
2. La feuille propose ses listes existantes, ou « Nouvelle liste ».
3. Il choisit « À travailler ».
4. **Climax :** il ouvre Favoris et retrouve la liste avec la passe dedans — le parcours du cours devient un plan de travail pour la semaine.

Échec : pas de réseau au moment d'ajouter. « Pas de réseau. Tes listes sont indisponibles ; tu peux quand même réviser. » L'ajout se refait à la main quand le réseau revient.

### Flow 4 — Le premier lancement (Christophe, un dimanche)

1. Il ouvre l'application pour la première fois après mise en place d'Access.
2. Réviser affiche « 12 passes à revoir », sans historique.
3. Il lance la session et découvre le mécanisme sur la première carte.
4. Il termine, ou quitte en cours de route.
5. **Climax :** il rouvre l'application le lendemain et voit une file du jour reconstituée à partir de ses votes de la veille — sa session d'hier a été retenue sans qu'il ait rien configuré.

### Flow 5 — L'enchaînement du dimanche (Christophe, avant le bal, chez lui, en wifi)

1. Il ouvre Favoris, liste « Ma choré du bal » : six passes ajoutées au fil de la semaine.
2. Il touche « Réordonner », fait remonter la passe d'ouverture de deux positions, puis touche « Terminer ».
3. Il touche « Enchaîner ». La première passe tourne, nom au-dessus, compteur « Passe 1 sur 6 ».
4. Après deux boucles, la passe suivante prend le relais, sans transition visible.
5. Sur la quatrième, il touche Pause, exécute la passe devant l'écran figé, puis reprend.
6. À la sixième : « Fin de l'enchaînement. », avec « Rejouer » et « Retour à la liste ».
7. **Climax :** il touche « Rejouer » et les six passes se succèdent sans autre interaction — sa liste est devenue une chorégraphie.

Échec : le geste suivant tarde. « Chargement du geste… » tient la place, l'enchaînement attend ; il peut toucher Précédente ou Pause pendant l'attente.

## Inspiration & Anti-patterns

- **Repris d'Anki** : la file du jour, la réponse cachée, l'auto-évaluation qui décide de la suite. C'est le moteur, pas l'habillage.
- **Repris de STEEZY** : la carte centrée sur le geste, sans habillage autour.
- **Rejeté — les séries et les ligues (Duolingo)** : la régularité n'est pas la compétence. Une semaine sans révision ne doit rien casser.
- **Rejeté — la lecture automatique en navigation** : un geste qui tourne pendant qu'on parcourt ne peut plus servir de réponse. Ce rejet ne vise que la navigation : dans l'enchaînement, la lecture est lancée d'un tap explicite depuis une liste, et rien ne tourne tant qu'on navigue.
- **Rejeté — le score de session** : « 9 sur 12 » transforme une révision en évaluation. Les trois états suffisent.

## Responsive & Platform

Mobile web de 375 à 430 px en référence. Au-delà de 768 px, le catalogue passe à deux puis trois colonnes ; la session de révision et l'écran d'enchaînement restent une colonne centrée de 560 px maximum. Les zones sûres sont respectées en haut et en bas ; la barre d'onglets ne recouvre jamais le dernier élément d'une liste, et la barre de lecture ne recouvre jamais le geste.

Sur natif, mêmes écrans et mêmes règles ; le cache fichier des gestes y fonctionne déjà, contrairement au web. Aucun écran ne dépend d'un survol, d'un clic droit ou d'un raccourci clavier pour être utilisable.
