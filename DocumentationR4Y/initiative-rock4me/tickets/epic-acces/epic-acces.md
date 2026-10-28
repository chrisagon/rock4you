---
tracker_id: ""
type: epic
title: "Accès sans compte"
parent: initiative-rock4me
covers: ["R3"]
sources: [DocumentationR4Y/initiative-rock4me/initiative-rock4me.md]
companions: [DocumentationR4Y/initiative-rock4me/architecture-phase-1/architecture-phase-1.md, DocumentationR4Y/initiative-rock4me/ux-phase-1/EXPERIENCE.md]
after: ["epic-enchainement"]
refined: false
risk: high
---

# Accès sans compte

## Description

Access authentifie avant l'application (OTP email, gratuit jusqu'à 50 utilisateurs) ; le Worker vérifie la preuve sur chaque route protégée via un middleware global ; un **seul cutover** (une story dédiée) retire les routes `/api/auth/*`, le stockage de jeton, les écrans de connexion, l'attachement Bearer du client et `CORS_ORIGIN` (AD-6). Déploiement sur une zone possédée : les hostnames de l'app et de l'API basculent ensemble, avec la migration Pages → Workers static assets au passage.

## Outcome

Pour Christophe : entrer dans l'application sans nom ni mot de passe, session gérée avant l'app, une seule preuve pour tout.

## Done when

- Aucun écran de connexion, d'inscription ou de réinitialisation n'existe dans le produit déployé ; un utilisateur authentifié arrive directement dans ses écrans.
- `/health` répond public ; une route protégée répond 401 sans preuve Access et 200 avec (vérifié sur l'App déployée).
- L'e-mail du JWT Access identifie la ligne `Utilisateurs` pré-seeded (provisionnement à première connexion).
- L'app et l'API portent les hostnames de la zone possédée ; Pages éventuellement migré en Workers static assets au même déploiement.
- Intégration: le parcours complet (Access → app → listes → enchaînement) tient en production.

## Boundaries

- Aucune fonctionnalité de partage : le schéma multi-utilisateurs reste dormant (C3).
- Les épics 1 à 3 ne prolongent pas la voie jeton pendant que le cutover attend (AD-6).
- Touch point: Cloudflare Zero Trust (application Access, règle OTP, réglages CORS) — owner: epic-acces — part `hitl` : configuration du compte Cloudflare et DNS, par Christophe
- Touch point: Worker — middleware Access global (AD-5), retrait du middleware et des routes jeton — owner: epic-acces
- Touch point: client — retrait du flux de connexion, de l'attachement Bearer et de `CORS_ORIGIN` (la client-coupe est dans la story de cutover : AD-6)
- Must not change: le comportement des listes et de l'enchaînement établis par les épics 1 à 3.

## References

- parent — DocumentationR4Y/initiative-rock4me/initiative-rock4me.md, section Requirements (R3)
- architecture — DocumentationR4Y/initiative-rock4me/architecture-phase-1/architecture-phase-1.md, sections AD-5, AD-6, AD-8, Deferred (zone, transport natif, exploitation)
- design — DocumentationR4Y/initiative-rock4me/ux-phase-1/EXPERIENCE.md, §Foundation (HYPOTHÈSE Access, aucun écran d'auth), §State Patterns (Profil)

## Notes

- Open question: quelle zone/domaine possédé porte l'app et l'API (`kartaro.workers.dev` ne l'établit pas) — l'épic se planifie après cette réponse ; la configuration DNS et Zero Trust est un travail `hitl`.