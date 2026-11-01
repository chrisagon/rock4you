---
id: 2
type: bug
title: "Bruit console LogBox « Unexpected text node » + boucle de rendu intermittente sur /search"
parent: none
covers: []
after: []
assignee: ""
refined: false
hitl: false
risk: low
severity: P3
---

# Bruit console LogBox « Unexpected text node » + boucle de rendu intermittente sur /search

## Description

En dev web, la console reçoit à répétition « Unexpected text node: . A text node cannot be a child of a <View> » (invariant react-native-web : un `<View>` reçoit un nœud texte — ici probablement une **chaîne vide** rendue à un commit transitoire, le `.` final étant la ponctuation du message). Par ailleurs, une erreur « Maximum update depth exceeded » apparaît de façon **intermittente** sur `/search` (2 runs sur 3 en headless), avec l'overlay LogBox ouvert au moment du scan. Non bloquant : le parcours complet (révélation → votes → plein écran → navigation) fonctionne malgré le bruit.

## Reproduction

- Environment : dev local (:8081 + :8787), Chrome headless.
- Sonde 1 (parcours complet) : warnings « Unexpected text node » = 121 au premier chargement (page /register), 36 au montage de `/search`, **0** pendant session/révélation/votes/plein écran/favoris/landing.
- Sonde 2 (scan DOM à froid) : aucun `<div>` avec nœud texte direct visible — le View fautif est **transitoire** (commit fugace), l'overlay LogBox masque l'application au scan sur `/search`.
- Sonde 3 (hook console.error + scan au moment du warning) : 0 capture sur ce run — reproduction intermittente selon l'état du cache Metro.
- Overlays observés sur `/search` : « Maximum update depth exceeded », call stack `Array.forEach <anonymous>:-1:0` non mappable, component stack nommant `ErrorOverlay`/`withDevTools(ErrorOverlay)` — suspicion que la boucle vive dans l'overlay LogBox lui-même en réaction au warning, non confirmé.
- Attendu : console propre en dev.

## Cause Hypothesis

Non attribuée à ce stade. Hypothèses testées et éliminées : (1) les effects de la porte média et des stories 1.2-1.6 (débordements bornés, un seul passage) ; (2) l'effect Dimensions de `app/(tabs)/search.tsx` (souscription + cleanup propre) ; (3) chaînes vides des données du catalogue (`remarks: ''` / `displacement: ''` = 0 occurrence) ; (4) les conditionnels `{string && <JSX>}` du catalogue ne tirent pas (données saines). Restent à tester : les `{' '}` et vues de séparation dans les écrans pré-épics, l'overlay LogBox lui-même, et une bissection par checkout de la baseline pré-épic. Le message « contenu vide » oriente vers un patron `{state && <Text>}` avec state à `''` au montage.

## Acceptance Criteria

1. **Console propre en dev**
   **Given** l'app lancée en dev web
   **When** le parcours révélation → votes → plein écran → navigation se déroule
   **Then** aucune entrée « Unexpected text node » ni « Maximum update depth exceeded » dans la console
2. **Tests**
   **Given** l'absence de suite de tests unitaires dans le repo
   **When** la correction est faite
   **Then** la sonde headless (script conservé en Références) rejoue le parcours et certifie l'absence
3. **Or: no change is needed, with proof**
   **Given** la reproduction
   **When** elle est rejouée sur le code courant
   **Then** le comportement attendu tient déjà, ou l'analyse était inexacte, avec la preuve consignée dans Notes — ceci supplante 1 et 2

## References

- parent — none (bruit console dev pre-épics suspecté, partagé entre écrans catalogue et auth)
- probes — `C:\Users\chris\AppData\Local\Temp\opencode\check-textnode.js` (parcours), `check-textnode2/3/4.js` (scans DOM + hook console) — session temporaire : transcrire le hook de capture au besoin
- screens — `app/(tabs)/search.tsx` (overlay intermittent), écran d'auth au chargement (121 warns), écrans épic vérifiés sains
- related — backlog id 1 (landing) : sans rapport fonctionnel, même campagne de diagnostic

## Notes

- Open question: « Maximum update depth exceeded » — intermittent et non mappable (frames `:-1:0`) : confirmer s'il vit dans l'overlay LogBox (dev-only) ou dans app code via bissection à baseline pré-épic.
- Open question: le View fautif du message texte-vide est transitoire — un hook DOM au moment exact du warning n'a pas recapté sur ce run ; réutiliser la sonde 3 avec un cache Metro froid.