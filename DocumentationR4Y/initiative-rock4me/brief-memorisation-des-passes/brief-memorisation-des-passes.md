---
title: "Brief produit — Rock4me"
status: draft
created: 2026-10-27
updated: 2026-10-28
---

# Brief produit : Rock4me

## Résumé

Rock4me est un catalogue de 244 passes de rock (219 URL distinctes, 215 jouables), organisé par niveaux et familles, consultable sur mobile. Il ne fait qu'une chose : retrouver une passe, la regarder, la ranger dans une liste, et jouer une liste d'un bout à l'autre. Il manque sa raison d'être : **aider à mémoriser les passes**.

La phase 1 ajoute la boucle de rappel : le nom s'affiche, le geste est caché, on se teste, on s'auto-évalue. Elle ne traite pas encore le poids des médias : chaque passe télécharge environ 17 Mo, donc la révision se pratique en wifi. Le pipeline média devient l'étape suivante, avec en phase 1 un correctif client minimal pour rétablir le cache du navigateur.

## Le problème

Je retiens les passes que je révise, et j'oublie les autres. L'app actuelle entretient une illusion de familiarité. Faire défiler des GIF jusqu'à ce qu'ils « me disent quelque chose » n'est pas du rappel, c'est de la reconnaissance. [HYPOTHÈSE] Sur 244 passes, je n'en retiens durablement qu'une poignée, et je ne sais pas lesquelles.

Quatre frictions :

1. **Le poids.** Chaque GIF pèse 15 à 18 Mo et rien ne le met en cache sur le web (mesures : addendum §1). Non traité en phase 1, qui se contente de rétablir le cache du navigateur.
2. **L'absence de signal.** 219 passes sur 244 n'ont pas de famille. Le seul indice à l'écran reste le nom, insuffisant pour 244 entrées.
3. **Aucune trace.** Rien ne dit ce qui est su, ce qui est à revoir, ni depuis quand.
4. **Un compte à gérer.** Inscription, mot de passe, et une session qui se perd à chaque visite : de la plomberie pour un utilisateur unique.

## État actuel et verdict technique

**Bien construit :** catalogue embarqué (recherche instantanée), listes virtualisées, breakpoints 1/2/3 colonnes, safe areas sur les écrans principaux, séparation client/API propre, CI de déploiement fonctionnelle.

**À corriger :** média (format, poids, cache, `r2.dev` est un endpoint de développement, traité avec le pipeline média), authentification surdimensionnée, session par cookie perdue, tri inopérant, listes plafonnées à 10, chargement N+1, grille favoris non virtualisée, cibles tactiles sous 24 px, difficulté 1-2 seulement, accessibilité quasi absente. Causes et détail : addendum §4.

**Hébergement :** la plateforme est la bonne, le produit l'est moins. Cloudflare recommande Workers static assets pour les nouveaux sites ; Pages est en maintenance. Les assets statiques y sont gratuits et illimités, et la migration est sans risque ici (aucune fonction Pages).

## La solution

**A. La boucle de rappel (phase 1).** Face de carte : nom, famille, niveau. Réponse : le geste, révélé sur action. Auto-évaluation à trois états : à revoir, hésité, su. Une file du jour plafonnée, avec un état « c'est fini pour aujourd'hui », ordonnée par ancienneté de révision et par taux d'échec. Boucle inspirée de la récupération active et de l'espacement (preuves : addendum §2).

**B. Une donnée qui sert d'indice (phase 1).** Remplir les familles et assumer la catégorie comme signal de récupération (Base, Balade, 3 tapes, Barrage, plus les familles à définir). Le niveau (Débutant, Intermédiaire, Avancé) reste un second axe fiable.

**C. Un accès simplifié (phase 1).** Cloudflare Access (OTP par email, gratuit jusqu'à 50 utilisateurs) remplace inscription, mot de passe, refresh token et allowlist CORS. Le schéma multi-utilisateurs reste en base : le jour du partage, il suffit d'inviter.

**D. Une médiathèque utilisable en mobilité (après la phase 1).** Les GIF actuels sont les masters : archivés intacts, puis dérivés en MP4/WebM avec poster, servis depuis un domaine R2 avec cache immuable et chargés à la demande. En phase 1, correctif minimal seulement : suppression du paramètre qui casse le cache, et chargement du GIF à la révélation, jamais avant.

**E. L'enchaînement (phase 1).** Depuis une liste, « Enchaîner » joue les passes de bout en bout : chaque geste tourne deux boucles [HYPOTHÈSE : paramètre ajustable], puis la passe suivante prend le relais sans transition, avec pause, précédente et suivante. Un mode « Réordonner » fixe l'ordre de danse. La fin propose Rejouer ou retour à la liste. Ce mode est un acte explicite, lancé d'un tap : la boucle de rappel reste inchangée, avec son geste masqué et son auto-évaluation ([HYPOTHÈSE] il s'appuie sur le chunking moteur pour lier des passes apprises, addendum §2).

## Ce qui rend ça différent

Pas de moat technique, et c'est assumé. L'atout est la matière : un catalogue de 244 passes déjà structuré par cours et par niveau. [HYPOTHÈSE] Aucun produit équivalent n'a été identifié : les outils qui font apprendre (Anki, Brainscape) n'ont pas de mouvement, les outils de danse (STEEZY) n'ont pas de mémorisation.

## Critères de succès

- Toutes les passes ont une famille, ou une famille « non classée » explicitement assumée.
- La file du jour existe, se termine, et le nombre de passes sues est consultable.
- Une liste de passes se joue d'un bout à l'autre après un seul lancement, avec pause et pas-à-pas ; une passe sans geste est sautée avec une mention, jamais bloquante.
- Une passe révélée n'est téléchargée qu'une fois par navigateur, puis servie par le cache.
- [HYPOTHÈSE] Par session de dix minutes, trois passes de plus réellement disponibles ; sur quatre semaines, le nombre de passes sues augmente sans que le temps de révision n'explose.
- Critères du pipeline média, à valider à cette étape : moins de 1 Mo par passe, moins d'une seconde sur 4G, session hors ligne après une première consultation.

## Périmètre

**Dans la phase 1 :** boucle de rappel avec auto-évaluation et file du jour · enchaînement des listes (lecture enchaînée, réordonnancement des passes dans une liste) · nettoyage et complétion des familles · Access à la place du compte · correctifs mobiles bloquants (cibles tactiles, safe areas, virtualisation de la grille favoris) · correctif média minimal (cache du navigateur rétabli, GIF chargé à la révélation seulement).

**Ordre :** boucle, familles, enchaînement, Access, correctifs. [HYPOTHÈSE] L'enchaînement se construit après la boucle : il réutilise le lecteur de geste. Effort total non estimé (inconnue) ; la dérivation des GIF est évaluée à quelques heures.

**Explicitement hors phase 1 :** pipeline média (archivage, dérivation, domaine R2) · ordonnancement espacé (SRS) · historique et statistiques · partage public et liens · notifications · vue de dos, miroir, ralenti · recherche par position ou par type · renommage des listes et réordonnancement des listes elles-mêmes (le réordonnancement des passes dans une liste est en phase 1, item E).

**Différé, pas abandonné :** pipeline média, avec ses critères de poids et de hors ligne (étape suivante) · SRS et états de maîtrise (une fois la boucle utilisée) · partage (si un danseur le demande) · migration Pages vers Workers static assets (au prochain déploiement, pas un chantier).

## Risques et inconnues

- **Le poids reste entier en phase 1.** Conséquence assumée : la révision et l'enchaînement se pratiquent en wifi, pas en mobilité data, jusqu'au pipeline média. Un enchaînement de cinq passes charge environ 84 Mo d'affilée (16,8 Mo en moyenne par GIF, addendum §1).
- **La qualité des familles.** 219 passes à classer relèvent du jugement, pas du script. Risque de rester à moitié fait.
- **La dérivation.** 219 GIF à retélécharger puis transcoder, à faire par script idempotent.
- **La demande de partage.** Non tranchable avant d'y arriver : l'absence de produit équivalent peut signaler un créneau ou une demande mince.

## Vision

À terme, un entraîneur de passes personnel : léger, hors ligne en cours, partageable par invitation.
