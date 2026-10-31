
- source_plan: DocumentationR4Y/initiative-rock4me/tickets/epic-boucle/tickets/story-tracer-file-du-jour-vivante-plan.md
  summary: Le libellé exact « Chargement du geste… » de la spine n'existe pas dans GifPlayer (logo + spinner natifs) ; la story 2 (porte média) possède la surface du player et portera le libellé.
  evidence: Trouvaille low vérifiée de la revue quick pass 1 : grep « Chargement du geste » vide sur le dépôt ; modifier GifPlayer est interdit à la story 1.1 par le plan lui-même ; la story 2 est le propriétaire de la porte média.

- source_plan: DocumentationR4Y/initiative-rock4me/tickets/epic-boucle/tickets/story-porte-media-unique-r6-plan.md
  summary: La landing page (app/index.tsx:42-45) charge un gif r2.dev en direct (~16,8 Mo par visiteur public), hors de la porte média unique.
  evidence: Trouvaille vérifiée de la revue quick story 1.2 : Image source={{ uri: 'https://pub-e9db5024dff64a89897b25c9ea2a0d59.r2.dev/111 Enroulés infinis V3.gif' }}, lecture de geste hors utils/gifCache.ts (AD-7) ; préexistant à la story, page publique hors R6 révélé ; correctif ~8 lignes (résoudre par cacheGif avant affichage).

- source_plan: DocumentationR4Y/initiative-rock4me/tickets/epic-boucle/tickets/story-auto-evaluation-a-trois-etats-plan.md
  summary: CORS_ORIGIN du .env.production (fichier sensible) ne liste aucune origine frontend réelle (valeur = origine API) ; l'allowlist exacte doit lister les origines Pages.
  evidence: Trouvaille vérifiée de la revue quick story 1.3 sur le diff de baseline : worker/wrangler.toml:21 porte les origines Pages réelles (rock4me.pages.dev, rock4you-frontend.pages.dev, rock4you.pages.dev) là où .env.production porte l'origine API ; AGENTS.md exige une allowlist d'origines frontend pour CORS_ORIGIN ; correction à opérer à un moment de manipulation de fichiers sensibles, hors story.

- source_plan: DocumentationR4Y/initiative-rock4me/tickets/epic-boucle/tickets/story-auto-evaluation-a-trois-etats-plan.md
  summary: L'écran de fin de session « C'est fini pour aujourd'hui. » omet le nombre de passes vues (EXPERIENCE.md:86).
  evidence: Trouvaille vérifiée de la revue quick story 1.3 ; la story 1.4 « Composition et fin de file » est le propriétaire déclaré de cet écran (son ticket porte le nombre de passes vues) — cross-check ici, pas de doublon de code en 1.3.

- source_plan: DocumentationR4Y/initiative-rock4me/tickets/epic-boucle/tickets/story-refactor-sweep-plan.md
  summary: JWT_SECRET de worker/.dev.vars = valeur déjà tracée dans worker/wrangler.toml (secret jumeau) et l'ancien jeton vit encore dans .env.production — rotation sans hygiène réelle.
  evidence: Trouvaille vérifiée de la revue quick story 1.5 ; les deux fichiers sont des fichiers sensibles déjà tracés (AGENTS.md Secrets) — opération de secret-hygiène humaine (rotation + purge croisée) hors story, au moment rotate-secret ou équivalent.

- source_plan: DocumentationR4Y/initiative-rock4me/tickets/epic-boucle/tickets/story-refactor-sweep-plan.md
  summary: AGENTS.md documente ~14 erreurs tsc préexistantes ; le réel mesuré au 2026-10-30 = 12 erreurs / 4 fichiers (components/Section.tsx, utils/gifCache.ts, worker/src/middleware/auth.ts, worker/src/routes/lists.ts).
  evidence: Trouvaille documentaire de la revue quick story 1.5 ; la mise à jour d'AGENTS.md est un fix différable à la baseline suivante (éditer AGENTS.md hors story par la classification) ; les runs mesurent maintenant 12/4 à trois reprises.
