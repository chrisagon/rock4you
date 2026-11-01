---
id: 1
type: bug
title: "L'utilisateur authentifié retombe sur la landing publique et se croit déconnecté"
parent: none
covers: []
after: []
assignee: ""
refined: false
hitl: false
risk: low
severity: P2
---

# L'utilisateur authentifié retombe sur la landing publique et se croit déconnecté

## Description

L'utilisateur déjà connecté qui ouvre `localhost:8081` (favoris, nouvel onglet, réflexe du lancement) retombe sur la landing publique, qui affiche « Se connecter » sans aucune trace d'état authentifié et sans raccourci vers l'appli. Il en déduit que sa session a été perdue et se ré-authentifie « à chaque fois » — alors que la session (cookie HttpOnly `auth_token`, `/api/auth/me` par cookie) survit réellement au rechargement, même à l'intérieur de l'appli.

## Reproduction

- Environment : app web en dev local (Expo :8081, Worker :8787), Chrome, compte créé via l'UI.
- Sonde instrumentée (navigateur headless, 2026-10-30) : register → 201, cookie `auth_token` posé (HttpOnly, expires ≈ +2 j) ; `GET /api/auth/me` = **200** après rechargement ; rechargement direct sur `/revise` → **reste authentifié** sur Réviser (« 12 passes à revoir », garde des tabs intacte même à 0,5 s) ; en revanche ouvrir ou recharger **`/`** → landing publique inchangée (« Se connecter », « Inscrivez vous gratuitement »), aucun indicateur de session, aucun CTA vers l'appli (buttons statiques de `app/index.tsx`, cibles `/app/login`).
- Rapport utilisateur 2026-10-30 : « j'ouvre l'app avec localhost:8081. Même si je me suis connecté sur un onglet et que j'ouvre un autre onglet je dois me reconnecter. »
- Attendu : un utilisateur authentifié qui visite la landing voit sa session reconnue et peut entrer dans l'appli sans se reconnecter.

## Cause Hypothesis

La landing (`app/index.tsx`) est entièrement statique : elle ignore l'état d'authentification (pas d'appel `/api/auth/me`, pas de logique conditionnelle sur la session). La mécanique de session — cookie posé au login/register, lecture par le cookie dans `GET /api/auth/me` (`worker/src/routes/auth.ts`, chemin « durcissement auth ») et garde des tabs (`app/(tabs)/_layout.tsx`) — est vérifiée fonctionnelle par la sonde. Le défaut vit donc dans l'entrée, pas dans la persistance : la landing devrait interroger la session et offrir l'entrée dans l'appli en conséquence. Chute naturelle chez Sofia : CTA « Aller à l'appli » conditionnel ou redirection douce — à trancher au refine (l'auto-redirect n'a pas été choisi par l'utilisateur).

## Acceptance Criteria

1. **L'utilisateur authentifié reconnaît sa session depuis la landing**
   **Given** une session valide (cookie `auth_token`, `/api/auth/me` 200)
   **When** j'ouvre `localhost:8081/` (premier chargement, rechargement, nouvel onglet)
   **Then** la landing m'offre l'entrée dans l'appli (forme tranchée au refine : CTA conditionnel ou redirection), sans me faire repasser par Se connecter
2. **L'anonyme ne voit aucun changement**
   **Given** aucune session valide
   **When** j'ouvre la landing
   **Then** la page est identique à aujourd'hui (mêmes boutons, aucun état authentifié suggéré)
3. **Or: no change is needed, with proof**
   **Given** la reproduction
   **When** elle est rejouée sur le code courant
   **Then** le comportement attendu tient déjà, ou l'analyse était inexacte, avec la preuve consignée dans Notes — ceci supplante 1 et 2

## References

- parent — none (standalone, touch point R3/épic Access non épiqué ; hors épic-boucle R1)
- sonde — script de reproduction `C:\Users\chris\AppData\Local\Temp\opencode\check-guard.js` (register → reload `/revise` → reste authentifié ; l'équivalent sur `/` montre la landing aveugle) — session temporaire : copier l'essentiel ici si besoin
- worker — `worker/src/routes/auth.ts` (pose du cookie au register/login, lecture du cookie dans `GET /api/auth/me`), AGENTS.md §API (le /me lit le Bearer **et** le cookie depuis le « durcissement auth »)
- client — `app/index.tsx` (landing statique), `contexts/AuthContext` (checkAuthStatus au démarrage), `app/(tabs)/_layout.tsx` (garde, inchangée)

## Notes

- Decision: 2026-10-30, l'utilisateur (Christophe) : mettre en file chez Sofia après diagnostic par sonde ; la forme du correctif (CTA conditionnel vs redirection douce) reste à trancher au refine.
- Assumption: le scénario rapporté (« nouvel onglet = reconnexion ») est le même mécanisme que la landing aveugle ; si un autre mécanisme apparaît (navigateur/onglet privé, autre origine), la reproduction le dira.
- Open question: la landing est vouée à disparaître ou à muter avec l'épic Access (R3 : aucun écran de connexion dans l'app) — le correctif doit-il survivre au cutover ou être jetable ?