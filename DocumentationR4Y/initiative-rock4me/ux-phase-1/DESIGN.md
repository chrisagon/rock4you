---
name: Rock4me
status: final
updated: 2026-10-28
description: Catalogue de passes de rock et entraîneur de révision personnel. Sombre, orange chaud, mobile d'abord.
colors:
  surface-base: '#1A1A1A'
  surface-raised: '#333333'
  surface-deep: '#000000'
  ink-primary: '#FFFFFF'
  ink-secondary: '#CCCCCC'
  ink-tertiary: '#999999'
  ink-muted: '#666666'
  accent: '#FF6B35'
  accent-wash: '#FF6B351A'
  success: '#4CAF50'
  warning: '#FF9800'
  danger: '#F44336'
  info: '#2196F3'
typography:
  title:
    note: 'Système natif, 28 px, gras'
  heading:
    note: 'Système natif, 20 px, semi-gras'
  body:
    note: 'Système natif, 16 px'
  meta:
    note: 'Système natif, 12 px'
rounded:
  sm: 8px
  md: 12px
  lg: 15px
  full: 9999px
spacing:
  '1': 4px
  '2': 8px
  '3': 12px
  '4': 16px
  '5': 20px
  '6': 40px
components:
  move-card:
    surface: '{colors.surface-base}'
    radius: '{rounded.md}'
    padding: '{spacing.4}'
  reveal-card:
    surface: '{colors.surface-raised}'
    radius: '{rounded.lg}'
    padding: '{spacing.5}'
  reveal-button:
    surface: '{colors.surface-raised}'
    ink: '{colors.ink-tertiary}'
    radius: '{rounded.md}'
    min-height: '44px'
  rating-button:
    surface: '{colors.surface-raised}'
    ink: '{colors.ink-primary}'
    radius: '{rounded.full}'
    min-tap: '44px'
  filter-chip:
    surface: '{colors.surface-base}'
    ink: '{colors.ink-secondary}'
    radius: '{rounded.full}'
  chain-button:
    surface: '{colors.accent}'
    ink: '{colors.surface-deep}'
    radius: '{rounded.full}'
    min-height: '44px'
  chain-card:
    surface: '{colors.surface-raised}'
    radius: '{rounded.lg}'
    padding: '{spacing.5}'
  chain-bar:
    surface: '{colors.surface-raised}'
    radius: '{rounded.full}'
    min-tap: '44px'
  level-badge:
    surface: '{colors.surface-base}'
    ink: '{colors.ink-tertiary}'
    radius: '{rounded.full}'
  tab-bar:
    surface: '{colors.surface-deep}'
    active: '{colors.accent}'
    inactive: '{colors.ink-tertiary}'
---

## Brand & Style

Rock4me est un outil de travail, pas une application de bien-être. L'écran s'efface derrière le geste : fond sombre pour ne pas éblouir dans une salle, un seul orange pour signaler ce qui compte, et une hiérarchie qui tient par la typographie plutôt que par les ornements.

La posture est sobre et directe. Pas de compteur de série, pas de félicitations, pas d'animation de récompense. Ce que l'écran doit produire, c'est une décision rapide : je sais, j'hésite, je ne sais pas. Tout le reste est du bruit.

Cette identité est reprise de l'application existante : surfaces `{colors.surface-base}`, `{colors.surface-raised}` et `{colors.surface-deep}`, texte `{colors.ink-primary}` à `{colors.ink-muted}`, accent `{colors.accent}`. La page d'accueil claire et l'écran d'inscription sortent du produit ; leur palette claire ne fait pas partie de ce système.

## Colors

- **Fond `{colors.surface-base}`** : la surface de lecture par défaut, celle des listes et des cartes. Sombre, jamais noir pur, pour que la carte de révision puisse s'en détacher.
- **Surface haute `{colors.surface-raised}`** : réservée à la carte de révision et aux contrôles qui demandent une décision. Une seule surface haute visible à la fois.
- **Profond `{colors.surface-deep}`** : la barre d'onglets et le voile derrière une modale. C'est le point le plus sombre de l'écran.
- **Encre primaire `{colors.ink-primary}`** : titres, noms de passes, valeurs. Secondaire `{colors.ink-secondary}` pour les métadonnées denses, tertiaire `{colors.ink-tertiary}` pour les libellés discrets, `{colors.ink-muted}` pour ce qui est désactivé.
- **Accent `{colors.accent}`** : un seul rôle à la fois, l'action principale de l'écran, et l'onglet actif. Jamais en remplissage derrière du texte long, jamais pour colorer une catégorie.
- **Lavé d'accent `{colors.accent-wash}`** : la sélection d'une puce de filtre, en fond uniquement.
- **Statuts** : `{colors.success}`, `{colors.warning}`, `{colors.danger}`, `{colors.info}` servent aux messages d'état. Ils ne décorent rien et ne classent rien.
- **Contraste** : le texte porte toujours au moins 4,5:1 contre sa surface ; le texte en `{colors.ink-muted}` peut descendre sous cette cible, il est désactivé et jamais porteur d'action.

À éviter : un dégradé, une image de fond, une couleur par famille de passe. La famille se lit dans le texte, pas dans la teinte.

## Typography

Conventions de plateforme : police système, jamais de police chargée. Les tailles constatées dans l'application sont 12, 14, 16, 18, 20, 28 et 32 px ; le système en retient quatre rôles.

- `title` : 28 px, gras. Le nom de la passe sur la carte de révision, et les titres d'écran.
- `heading` : 20 px, semi-gras. Les titres de section dans une liste.
- `body` : 16 px. Les libellés d'action et les métadonnées lisibles.
- `meta` : 12 px. Niveau, famille, comptes.

Aucune capitale forcée pour un libellé, aucun texte en dessous de 12 px, et le nom d'une passe n'est jamais tronqué sur la carte de révision : c'est l'indice, il doit être lisible en entier.

## Layout & Spacing

Échelle : `{spacing.1}` 4, `{spacing.2}` 8, `{spacing.3}` 12, `{spacing.4}` 16, `{spacing.5}` 20, `{spacing.6}` 40 px. Les espacements de 6 et 15 px trouvés dans le code existant reviennent à 8 et 16 px au fil des retouches ; le rayon de 15 px de la carte de révision, lui, reste.

Marges latérales de `{spacing.5}` sur mobile, `{spacing.6}` au-delà de 768 px. Une seule colonne sur mobile ; la grille existante passe à deux puis trois colonnes sur grand écran, mais la carte de révision reste une colonne centrée, largeur maximale 560 px.

La barre d'onglets occupe `{spacing.6}` plus la zone sûre basse. Aucun contenu ne passe dessous.

## Elevation & Depth

Deux niveaux seulement : `{colors.surface-base}` et `{colors.surface-raised}`. La profondeur vient du ton, pas d'une ombre.

La seule ombre autorisée est le voile d'une modale : `{colors.surface-deep}` à 80 % d'opacité, comme dans le code existant. Pas d'ombre portée sur une carte, pas de bordure lumineuse, pas d'effet de verre.

## Shapes

Rayons : `{rounded.sm}` 8 px pour les champs, `{rounded.md}` 12 px pour les cartes de liste, `{rounded.lg}` 15 px pour la carte de révision, `{rounded.full}` pour les boutons d'auto-évaluation, les puces et les pastilles.

Une image ou un geste prend exactement le rayon de son conteneur. Pas de cercle pour une surface, pas de coin carré sur une carte.

## Components

- **Carte de passe (liste)** : `{colors.surface-base}`, rayon `{rounded.md}`, padding `{spacing.4}`. Nom en `body`, métadonnées en `meta`. Une action principale au plus par carte : ouvrir la fiche.
- **Carte de révision** : `{colors.surface-raised}`, rayon `{rounded.lg}`, padding `{spacing.5}`, hauteur minimale 60 % de l'écran visible. Le nom en `title` domine ; famille et niveau en `meta` juste en dessous ; l'emplacement du geste reste vide jusqu'à la révélation.
- **Bouton de révélation** : occupe l'emplacement du geste, texte `{colors.ink-tertiary}`, rayon `{rounded.md}`, hauteur minimale 44 px. Il disparaît après la révélation.
- **Barre d'auto-évaluation** : trois boutons de `{rounded.full}`, hauteur minimale 44 px, libellés « À revoir », « Hésité », « Su ». Elle n'apparaît qu'après la révélation.
- **Barre d'onglets** : `{colors.surface-deep}`, onglet actif en `{colors.accent}`, inactifs en `{colors.ink-tertiary}`. Quatre onglets, pas cinq.
- **Puce de filtre** : `{colors.surface-base}`, texte `{colors.ink-secondary}` ; sélectionnée, fond `{colors.accent-wash}` et texte `{colors.accent}`.
- **Pastille de niveau** : texte `meta` sur `{colors.surface-base}`, rayon `{rounded.full}`. Elle informe, elle ne classe pas visuellement.
- **Feuille de filtres** : fond `{colors.surface-raised}`, coin supérieur arrondi `{rounded.md}`, voile `{colors.surface-deep}` à 80 % d'opacité.
- **Bouton « Enchaîner »** (en-tête de liste) : fond plein `{colors.accent}`, texte `{colors.surface-deep}`, rayon `{rounded.full}`, hauteur minimale 44 px. Une seule par écran de liste : c'est son action principale.
- **Carte d'enchaînement** : même géométrie et mêmes tons que la carte de révision (`{colors.surface-raised}`, rayon `{rounded.lg}`, padding `{spacing.5}`, hauteur minimale 60 % de l'écran visible) ; le geste occupe le cadre dès l'arrivée, jamais masqué.
- **Barre de lecture** : trois boutons sur fond `{colors.surface-raised}`, rayon `{rounded.full}`, hauteur minimale 44 px, posés sous le geste ; le compteur « Passe 2 sur 5 » en `meta`.

## Do's and Don'ts

| Faire | Ne pas faire |
|---|---|
| Un seul accent par écran, sur l'action qui compte | Colorer les familles, les niveaux ou les états de révision |
| Hiérarchie par taille et par ton | Ombres, dégradés, transparences décoratives |
| Nom de passe toujours entier | Tronquer l'indice ou le réduire à une icône |
| Surface haute réservée à la décision | Empiler deux surfaces hautes |
| Cibles tactiles de 44 px minimum | Une icône nue de 20 px comme seule cible |
| Une seule lecture à la fois, lancée d'un tap explicite | Lancer une lecture sans tap explicite, ou empiler deux lectures |
