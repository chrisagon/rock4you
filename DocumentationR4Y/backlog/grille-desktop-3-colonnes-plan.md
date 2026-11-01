---
title: 'Grille desktop 3 colonnes écrasées (backlog / ResponsiveGrid)'
type: 'bugfix'
ticket: '3'
created: '2026-11-01'
status: 'built'
baseline_revision: '550eb21592ca'
route: 'oneshot'
route_source: 'auto'
risk: 'low'
review: ''
review_source: ''
lenses_ran: []
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** la grille des résultats desktop s'affiche en 3 colonnes écrasées dans son conteneur de ~75 % (à côté de la colonne filtres) dès ~900 px de fenêtre — la 3ᵉ colonne est rognée.

**Approach:** `ResponsiveGrid` mesure sa propre largeur réelle via `onLayout` et en déduit colonnes et itemWidth (contrat du composant : « dynamiquement selon la largeur »), au lieu de la largeur de la fenêtre ; aucune autre surface touchée.

</frozen-after-approval>

## Implementation Notes

- Route oneshot : ~12 lignes sur 1 fichier.
- 2026-11-01 — Implémentation en trois pas, chaque pas corrigé par la sonde : (1) `onLayout` sur FlatList ne circule pas (propre à FlatList : la prop n'est pas aventure) → wrapper `View` portant `onLayout` (grilleConteneur, flex: 1) ; (2) la mesure seule ne suffisait pas : `getNumColumns(940)` = 3 (seuil pensé fenêtre) et les cartes restaient calées par le parent (`width={itemWidth}` issu de la fenêtre) → plancher de lisibilité 320 px bornant les colonnes + **la grille devient l'autorité** : `renderItem` reçoit `largeur` et `colonnes` réels et les call-sites (Recherche desktop/mobile) s'y raccrochent (plus de largeur issue de la fenêtre) ; (3) vérifié : lignes de grille 2 × 443 dans un conteneur de 940, plus de 3ᵉ colonne rognée, plus d'overflow du row.
- 2026-11-01 — Revue (quick lens, 1 pass) : trouvailles retenues = le dead itemWidth (corrigé par l'autorité grille), l'overflow de 20 px du row desktop (corrigé : 2 × 443 + 15 = 901 pile la case), le cas W ≥ 1240 toujours en 3 colonnes (corrigé par le plancher + autorité : à 1440, conteneur ~1100 → 3 colonnes de ~341 ≥ plancher ✓ alignées), le flash/remontage au premier layout (la fenêtre sert d'estimation avant la mesure — accepté, pattern préexistant), le risque flex:1 sous le ScrollView des Favoris sur natif (neutralisé par CSS sur web ; la vigilance natif passe à l'épic correctifs) ; typo du commentaire corrigée.
- 2026-11-01 — Déploiement : tentatives bloquées par le réseau Cloudflare (timeouts en série) — le build corrigé (`entry-78571d18`) attende en dist/ ; à rejouer quand le réseau revient, même commande.

## Verification

**Commands:**
- `npx tsc --noEmit` (racine) — expected: 12/12 baseline inchangé.

**Manual checks (headless ≥ 900 px + utilisateur):**
- Recherche desktop : 2 colonnes complètes à droite des filtres ; Favoris/Accueil non régressés.