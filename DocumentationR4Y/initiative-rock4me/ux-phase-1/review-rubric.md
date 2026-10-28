# Spine Pair Review — Rock4me

## Overall verdict
Paire de spines cohérente et directement extractible par story-dev : la couverture des flux tient à la fois le brief et l'enchaînement (jugé contre le memlog, tout y est), et la forme est canonique. Le contrat casse seulement sur la couche jetons — `accent-wash` viole la règle d'hex du spec, et aucun objectif de contraste n'est énoncé alors que l'Accessibility Floor délègue explicitement le contraste à `DESIGN.md`. Les états réseau de Favoris et la persistance du mode Réordonner sont les incertitudes restantes pour les stories.

## 1. Flow coverage — strong
Vérifié : chaque journey du brief (boucle de rappel · retrouver une passe · ranger une passe · premier lancement · accès Access sans écran de login · correctif média « chargé à la révélation seulement » · file plafonnée et « c'est fini pour aujourd'hui » · familles « Non classée ») a une Key Flow ou une couverture IA ; l'enchaînement (mode plein écran lancé d'une tête de liste, deux boucles par passe, Précédente/Pause/Suivante, fin avec « Rejouer » + « Retour à la liste », mode Réordonner, passes sans geste sautées, périmètre phase 1) est couvert contre le memlog (lignes 24–33 : chaque décision a son état ou son composant). Chaque flux a son protagoniste nommé (Christophe), ses étapes numérotées et son **Climax** ; les flux 1 et 5 portent un Échec. Le surface Profil est explicitement déclaré sans flux (EXPERIENCE.md:35), décision assumée et documentée — pas un manque.

### Findings
- **low** Les flux 2 et 3 n'ont pas de chemin d'échec alors que leurs surfaces en ont des documentés : Catalogue a « Aucun résultat » + « Effacer les filtres » et Favoris a « Hors ligne, listes », mais ni le filtre infructueux ni l'ajout à une liste hors ligne ne sont rejoués dans le flux (EXPERIENCE.md:137-150). *Fix :* une ligne « Échec : » par flux, renvoyant à l'état existant — aucune nouvelle règle à inventer.

## 2. Token completeness — adequate
Vérifié : les 18 couleurs du frontmatter, les 4 rôles typography, les 4 rayons, les 6 espacements et les 10 composants du frontmatter sont définis ; chaque référence `{path.to.token}` du prose des deux spines (Brand, Colors, Shapes, Layout, Components de DESIGN.md) se résout. La typographie suit la règle plateforme du spec (`note` au lieu de valeurs littérales, comme l'exemple Quill). Deux charges lourdes manquent : le type hex et le contraste.

### Findings
- **critical** `accent-wash` vaut `'rgba(255, 107, 53, 0.1)'` : le spec exige des valeurs hex pour `colors` (DESIGN.md:14 ; design-md-spec.md « Values are hex strings »). Un consommateur qui résout les jetons type par type lèvera une erreur, et le statut `final` est revendiqué sur un jeton mal formé. *Fix :* passer en hex sur 8 chiffres (ex. `'#FF6B351A'`) et mettre à jour la mention du prose (DESIGN.md:101).
- **high** Aucun objectif de contraste n'est énoncé, alors que l'Accessibility Floor délègue « Le contraste visuel vit dans `DESIGN.md` » (EXPERIENCE.md:112) et que `DESIGN.md` ne dit rien de chiffré. Deux combinaisons porteuses sont sous AA : encre `{colors.ink-primary}` sur pilule `{colors.accent}` du bouton « Enchaîner » (~2,8:1, action principale de liste), et `{colors.ink-muted}` `#666` sur `{colors.surface-base}` (~3:1 — acceptable seulement si réservé au désactivé, ce qu'il faut écrire). *Fix :* une ligne de cible numérique dans Colors (ex. texte ≥ 4,5:1) + éclaircir le texte de la pilule accent ou l'encre posée dessus.
- **low** Les marges latérales (20 px mobile, 40 px au-delà de 768 px) sont énoncées en chiffres dans le prose au lieu de référencer `{spacing.5}`/`{spacing.6}` ou de jetons nommés (`margin-mobile`) comme le permet le spec (DESIGN.md:121). *Fix :* référencer les jetons existants pour que les marges suivent le frontmatter.

## 3. Component coverage — strong
Vérifié : les 12 lignes de Component Patterns (EXPERIENCE.md:62-75) et les 10 composants du prose DESIGN.md:139-148 sont nommés de façon identique entre sections ; les 10 clés du frontmatter se mappent toutes une pour une (move-card→Carte de passe, reveal-card→Carte de révision, reveal-button→Bouton de révélation, rating-button→Barre d'auto-évaluation, filter-chip→Puce de filtre, play-button→Bouton « Enchaîner », sequence-card→Carte d'enchaînement, sequence-bar→Barre de lecture, level-badge→Pastille de niveau, tab-bar→Barre d'onglets). Chaque ligne porte des règles réelles (44 px, déclencheurs, contenu), jamais des descriptions d'un mot. Les composants absents de DESIGN.md (Bouton Passer, Mode Réordonner, En-tête de file) sont explicitement déclarés comportement-only par le préambule (EXPERIENCE.md:60).

### Findings
- **low** Les « Feuille de filtres » ont des règles de comportement mais aucune ancre visuelle : surface, rayon et voile n'existent que dispersés dans Elevation (« le voile derrière une modale ») et Shapes, pas de ligne dédiée (EXPERIENCE.md:74 ; DESIGN.md:129,133). *Fix :* soit une ligne Components (surface `{colors.surface-raised}`, rayon `{rounded.md}`), soit une phrase déclarant la feuille comportement-only dans le préambule côté visuel.

## 4. State coverage — adequate
Vérifié : chaque surface de l'IA balisée. Réviser est complet (premier lancement, jours suivants, file vide, hors ligne). Session est complet (révélation en cours, geste introuvable, hors ligne, session terminée). Les surfaces nouvelles sont riches : écran d'enchaînement (lancement, passage suivant avec précharge, passe sans geste sautée, pause, écran de fin sans rebouclage, liste sans passe jouable) et le Catalogue (aucun résultat, passe sans geste). Les angles morts sont concentrés sur le réseau de Favoris.

### Findings
- **medium** Favoris n'a aucun état de chargement ni d'erreur serveur : c'est la seule surface alimentée par l'API (les listes viennent du réseau, cf. « Pas de réseau. Tes listes sont indisponibles »), et la table saute du lancement direct aux favoris sans état intermédiaire (EXPERIENCE.md:77-96). *Fix :* deux lignes d'état (chargement + échec) avec traitement « les listes tournent en local ? non — message et réessai ».
- **medium** Favoris vide (aucune liste, aucune favorite) n'est défini que par la ligne générique « État vide » — la phrase et l'action de renvoi (ex. « Ajoute des passes depuis le Catalogue ») n'existent pas, alors que le flux 3 suppose une liste déjà existante (EXPERIENCE.md:75,145-150). *Fix :* ligne « Favoris vide » avec phrase + action.
- **medium** La persistance du mode Réordonner est indéterminée : « L'ordre est conservé à l'écran, carte par carte » ne dit ni quand l'ordre est sauvegardé (à « Terminer » ? immédiatement ?), ni ce qu'il advient hors ligne ou si la sauvegarde échoue — un story-dev devra trancher seul (EXPERIENCE.md:73,95). *Fix :* une phrase : la sauvegarde se produit à « Terminer », l'échec laisse l'ordre local et signale le décalage.
- **low** Lancement de l'enchaînement avec premier geste lent non couvert : « La première passe s'affiche et se joue aussitôt » suppose le geste prêt, et l'état « Chargement du geste… » n'est décrit qu'en cours de séquence ; de même, « Précédente » sur la première passe et le clavier sur l'écran de fin ne sont pas bornés (EXPERIENCE.md:72,89,90,104). *Fix :* une phrase par angle — attendre au lancement comme en séquence, « Précédente » désactivé sur la première.
- **low** Fiche passe sans état : la présentation d'une passe « pas de geste » sur la fiche et le geste hors ligne (non encore en cache) n'ont pas de traitement, bien que le bouton Enchaîner soit interdit pour elle (EXPERIENCE.md:29,87). *Fix :* une ligne : la fiche répète la mention du catalogue et affiche les métadonnées sans cadre de geste.

## 5. Visual reference coverage — strong
Vérifié : le workspace ne contient que DESIGN.md, EXPERIENCE.md, .memlog.md et ux-phase-1.md — aucun dossier mockups/, wireframes/ ni imports/ (ce qui est prévu pour la phase 1). L'absence est cohérente : le memlog enregistre la décision « no mockups : every surface is built from the spine tables » (memlog:19), et aucun des deux spines ne référence un chemin de maquette (contrairement à l'exemple Quill, qui pointe `mockups/…`). Aucune référence pendante.

### Findings
Aucun.

## 6. Bloat & overspecification — strong
Vérifié : aucun pixel répété à côté des jetons (les répétitions « 44 px » du prose DESIGN.md:141-148 doublent `min-height`/`min-tap` du frontmatter pour le lecteur humain, en accord avec l'exemple) ; aucune reformulation pure du source sans décision ajoutée ; le prose d'EXPERIENCE.md est fonctionnel, pas éditorial (le brand voice vit dans DESIGN.md, cf. EXPERIENCE.md:43). Chaque section est chargée : Inspiration et Responsive sont justifiés par leurs contenus (Anki/STEEZY/Duolingo ; 375→768 px, natif).

### Findings
- **low** Redondance locale : la clause « pour que le retour du navigateur et le retour Android les quittent proprement » est écrite deux fois en trois lignes (EXPERIENCE.md:37,39), et la règle « pause gèle le geste » est énoncée à trois endroits (composant, état, Interaction Primitives — EXPERIENCE.md:72,92,104). *Fix :* garder un lieu normatif par règle ; les autres lignes renvoient.

## 7. Inheritance discipline — adequate
Vérifié : `sources` se résout (brief et addendum existent tous les deux au chemin cité) ; le vocabulaire du Foundation est sans synonymes et tenu partout (« passe », « geste », « carte », « fiche », « file du jour », « session », « enchaînement », jamais « GIF » pour le contenu) ; les noms de composants sont identiques entre les deux spines ; la correction memlog « Enchaîner » est bien appliquée dans les deux fichiers ; les chiffres concordent (29 passes sans geste = 244 − 215 jouables du brief). Une divergence de source reste ouverte.

### Findings
- **medium** Le brief déclare « renommage et réordonnancement des listes » explicitement hors phase 1 (brief-memorisation-des-passes.md:63), alors que la spine embarque le mode Réordonner en phase 1. Le memlog enregistre la décision utilisateur (memlog:29,31), mais rien ne lie la mise à jour à la ligne du brief qu'elle remplace : un lecteur du brief la trouvera en conflit. *Fix :* une ligne dans le brief ou l'addendum (« réordonnancement inclus en phase 1 sur instruction utilisateur, voir ux-phase-1 ») — le statut `draft` du brief le permet.
- **low** Synonyme interne : « la carte de décision » dans le prose Colors (DESIGN.md:97) désigne la « Carte de révision », le seul synonyme du vocabulaire par ailleurs tenu strictement (EXPERIENCE.md:18). *Fix :* remplacer par « carte de révision ».

## 8. Shape fit — strong
Vérifié : DESIGN.md suit l'ordre canonique exact (Brand & Style → Colors → Typography → Layout & Spacing → Elevation & Depth → Shapes → Components → Do's and Don'ts, DESIGN.md:86-159) avec le frontmatter complet (name, status, description one-line, colors, typography, rounded, spacing, components). EXPERIENCE.md contient tous les requis dans l'ordre attendu (Foundation → IA → Voice and Tone → Component Patterns → State Patterns → Interaction Primitives → Accessibility Floor → Key Flows, EXPERIENCE.md:14-170), plus les requis-si-applicables (Inspiration & Anti-patterns, Responsive & Platform). Aucune section inventée ; aucune section manquante.

### Findings
Aucun.

## Mechanical notes
- `sources` d'EXPERIENCE.md : les deux chemins se résolvent réellement (`../brief-memorisation-des-passes/brief-memorisation-des-passes.md` et `addendum.md` existent). DESIGN.md n'a pas de frontmatter `sources` : conforme au spec et à l'exemple Quill (seule EXPERIENCE les porte).
- Frontmatter complet des deux côtés (`name`, `status: final`, `updated` d'EXPERIENCE à 2026-10-28, postérieur au memlog 2026-10-27 — l'écriture a suivi l'enregistrement) ; `status: final` revendiqué alors que le jeton critique `accent-wash` est mal formé (voir §2).
- Clé de frontmatter `play-button` désigne le bouton « Enchaîner » : lisible via le mapping du prose, mais trompeuse (aucune lecture n'est lancée par ce bouton ; il lance une séquence) ; `rating-button` singulier désigne une barre de trois boutons. Clés kebab anglais vs noms français de prose : convention du spec, non pas d'un défaut — mais un renommage futur (`sequence-launch-button`, `rating-bar`) éviterait une mauvaise résolution.
- La référence non accolée « en méta » (EXPERIENCE.md:65,72) et « `title`/`body`/`meta` » de DESIGN.md pointent les rôles de `typography` par leur nom : conforme à la convention de l'exemple mobile (`{typography.meta}` n'est pas requis dans le prose).
- `rounded.lg: 15px` : valeur non standard mais délibérée (le rayon historique de la carte de révision est conservé, DESIGN.md:119,133) — cohérent entre frontmatter, Shapes et carte de révision.
- Aucune référence croisée cassée : tous les `{colors.*}`, `{typography.*}` (implicites), `{rounded.*}`, `{spacing.*}` se résolvent ; aucune référence de fichier maquette n'existe à rompre.
- Memlog et spines : la totalité des décisions enchaînement (2 boucles, contrôle limite, écran de fin, mode Réordonner à cibles de 44 px, saut des passes sans geste, masquage d'« Enchaîner » sans passe jouable, périmètre phase 1) se retrouve dans les spines — aucune décision du memlog n'est orpheline.