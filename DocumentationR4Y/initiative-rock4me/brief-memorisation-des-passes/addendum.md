---
title: "Addendum — Rock4me, preuves et options écartées"
status: draft
created: 2026-10-27
updated: 2026-10-27
---

# Addendum au brief Rock4me

Ce fichier garde la profondeur qui n'a pas sa place dans le brief : mesures, sources, options écartées et inventaire de dette technique.

## 1. Mesures média (relevées le 2026-10-27)

- 244 passes cataloguées : 225 ont une URL non vide, 219 URLs sont distinctes, toutes en `.gif`.
- 215 passes ont `hasGif: true`, 19 n'ont aucune URL, et 10 ont une URL alors que `hasGif` vaut `false` (elles ne sont donc jamais jouées, `data/danceMoves.ts` refuse de renvoyer l'URL).
- Dix URLs échantillonnées en HEAD : neuf répondent 200 en `image/gif`, de 15 404 689 à 17 953 653 octets (moyenne ≈ 16,8 Mo) ; une répond 404 (`51 Clé de bras infinie.gif`).
- Toutes sont servies depuis `pub-e9db5024dff64a89897b25c9ea2a0d59.r2.dev` : pas de domaine personnalisé, pas de `Cache-Control` observé.
- Aucune variante redimensionnée, aucun transcodage. Les objets R2 sont les GIF d'origine.
- Côté client, `GifPlayer` ajoute `?t=Date.now()` à chaque lecture, ce qui contourne le cache navigateur. Le cache fichier natif plafonne à 100 Mo et n'existe pas sur le web.
- [HYPOTHÈSE] Ordre de grandeur total : 219 × 16,8 Mo ≈ 3,7 Go de médias, soit environ trente fois le poids utile.

Conséquence : le format et la diffusion sont le premier levier de perception de vitesse. Le code React n'est pas le goulot d'étranglement.

## 2. Preuves sur la mémorisation

- **Récupération active** : Dunlosky et al. 2013, *Psychological Science in the Public Interest* 14(1) ; la pratique du test y est classée « high utility ». https://doi.org/10.1177/1529100612453266
- **Effet du test** : Roediger & Karpicke 2006, *Psychological Science*. https://doi.org/10.1111/j.1467-9280.2006.01693.x
- **Espacement** : Cepeda et al. 2006, *Psychological Bulletin* 132(3) ; la pratique espacée l'emporte dans 259 comparaisons sur 271. https://doi.org/10.1037/0033-2909.132.3.354
- **Difficulté désirable** : Pyc & Rawson 2009, *Journal of Memory and Language* 60(4). https://doi.org/10.1016/j.jml.2009.01.004
- **Interférence contextuelle (interleaving)** : Shea & Morgan 1979, *JEP: Human Learning and Memory* 5(2) ; moins bon à l'acquisition, meilleur à dix jours. Preuve solide en tâche simple, plus contestée en habileté complexe.
- **Chunking moteur** : Verwey & Eikelboom 2003, *Journal of Motor Behavior* ; Sakai et al. 2003, *Experimental Brain Research*. Les séquences se mémorisent par blocs, puis se concatènent.
- **Double codage** : Mayer, *Multimedia Learning*. Nommer en plus de montrer bat montrer seul.
- **Consolidation par le sommeil** : Walker et al. 2002, *Neuron* 35(1). Gain nocturne sur une séquence motrice.
- **Marquage** : Warburton et al. 2013, *Psychological Science* 24(9). Exécuter en amplitude réduite améliore l'apprentissage.
- **Perspective de caméra** : Versace et al. 2026, *PLOS ONE*. La vue de dos donne les meilleurs scores ; face-miroir et face-opposée ne diffèrent pas significativement. https://doi.org/10.1371/journal.pone.0355860
- **Ralenti** : Lelievre, St Germain & Ste-Marie 2021, *Human Movement Science*. Aucun effet significatif du ralenti par rapport au temps réel. https://pubmed.ncbi.nlm.nih.gov/33421652/
- **Fluence illusoire** : Karpicke, Butler & Roediger 2009, *Memory* 17(4). Les apprenants surévaluent la relecture et sous-utilisent l'auto-test. https://doi.org/10.1080/09658210802647009

Ce qui n'a pas pu être établi : aucune étude ne compare le GIF en boucle et la courte vidéo pour apprendre un mouvement ; aucune ne isole la musique ou le comptage comme aide mnésique ; l'existence de produits « flashcards pour le mouvement » n'est pas confirmée.

## 3. Options considérées

| Option | Décision | Raison |
|---|---|---|
| Garder les GIF tels quels | Assumé en phase 1, rejeté comme état final | 16 Mo par passe rendent le mobile et le hors ligne impraticables |
| Correctif client minimal (cache-busting retiré, GIF chargé à la révélation) | Retenu en phase 1 | Rétablit le cache du navigateur sans transcodage ni nouveau stockage |
| Animated WebP seul | Rejeté comme cible | Gain réel, mais la vidéo reste plus légère et permet poster et contrôle de lecture |
| MP4/WebM avec poster | Retenu pour l'étape média | 0,3 à 0,8 Mo visés, contrôle de lecture, formats mis en cache par défaut chez Cloudflare |
| Cloudflare Images `format=auto` | Non retenu en phase 1 | Ne produit pas de vidéo ; utile seulement si des images fixes multi-largeurs arrivent |
| Garder le compte utilisateur | Rejeté | Surface inutile pour un usage solo, et la session est déjà cassée |
| Cloudflare Access | Retenu | Gratuit jusqu'à 50 utilisateurs, OTP par email, supprime inscription et réinitialisation |
| Supprimer l'API et stocker en local | Rejeté pour l'instant | Le schéma multi-utilisateurs et la synchronisation multi-appareils ont de la valeur |
| SRS dès la phase 1 | Différé | Une boucle simple non utilisée ne justifie pas un ordonnanceur |
| Migration Pages vers Workers | Différé au prochain déploiement | Aucune fonction Pages à porter, risque quasi nul |

## 4. Dette technique et anomalies de données

- **Session** : `GET /api/auth/me` ne lit que l'en-tête Bearer et le client n'envoie jamais de jeton. La restauration par cookie échoue à chaque visite.
- **Tri** : l'état `selectedSort` de l'écran Recherche change, mais n'est jamais appliqué au filtrage.
- **Pagination** : `GET /api/lists` plafonne à 10 par défaut côté serveur ; le client n'envoie pas de `limit` et n'affiche donc que la première page.
- **N+1** : le chargement des playlists fait une requête par playlist après la liste.
- **Virtualisation** : la grille des favoris est imbriquée dans un `ScrollView`, ce qui désactive la `FlatList`.
- **Cibles tactiles** : bouton GIF à 24 px, plein écran et cœur sans `hitSlop` ; le code n'utilise aucun `hitSlop`. Le minimum recommandé est de 44 px.
- **Accessibilité** : quatorze occurrences de rôles ou de libellés, concentrées sur quelques composants ; les actions de carte n'en ont pas.
- **Données** : familles, Base 13, Balade 9, 3 tapes 2, Barrage 1, vide 219. Difficulté, 1 pour 235 passes et 2 pour 9, alors que l'interface propose 1 à 5. Le chapitre « 33 : Nuques » a `courseOrder: 0`.
- **Code mort** : `initialPlaylists`, `updatePlaylist` inutilisé, `categories` jamais importé, composant de documentation non routé, profil avec statistiques codées en dur et menus sans action.
- **Web** : `web.output: "single"` produit une seule page, sans pré-rendu par route. Acceptable pour une app privée, à revoir seulement si le partage devient public.

## 5. Hypothèses à confirmer

1. Le partage avec d'autres danseurs n'est pas un objectif de la phase 1.
2. La file du jour peut être ordonnée par ancienneté et par taux d'échec, sans ordonnanceur formel.
3. La dérivation des 219 GIF, à l'étape média, prend quelques heures et non quelques jours.
4. Les familles manquantes peuvent être déduites du nom et du cours sans arbitrage lourd.
