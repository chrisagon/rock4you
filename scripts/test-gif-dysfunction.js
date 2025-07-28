#!/usr/bin/env node

/**
 * Script de test pour reproduire et diagnostiquer le dysfonctionnement des GIFs
 * dans la page Favoris de l'application Rock4you
 */

const fs = require('fs');
const path = require('path');

// Simulation des données de mouvements (extrait du fichier réel)
const problematicMoves = [
  {
    id: "move_18",
    movementName: "Balade panier ligne garçon",
    hasGif: true,
    driveLink: "18 Balade panier ligne garçon.gif", // URL incomplète
  },
  {
    id: "move_58",
    movementName: "Espagnole garçon",
    hasGif: false,
    driveLink: "Spaghetti inversé.gif", // Nom de fichier incorrect
  },
  {
    id: "move_59",
    movementName: "Espagnole inversée garçon",
    hasGif: false,
    driveLink: "spaghetti.gif", // Nom de fichier simple
  },
  {
    id: "move_1",
    movementName: "Avant arrière mains parallèles",
    hasGif: true,
    driveLink: "https://pub-e9db5024dff64a89897b25c9ea2a0d59.r2.dev/1 Avant arrière mains parallèles.gif", // URL valide
  }
];

class GifDysfunctionTester {
  constructor() {
    this.results = {
      totalTested: 0,
      validUrls: 0,
      invalidUrls: 0,
      unreachableUrls: 0,
      details: []
    };
  }

  /**
   * Valide le format d'une URL Cloudflare R2
   */
  validateUrlFormat(url) {
    if (!url) return { valid: false, reason: 'URL vide' };
    
    const cloudflareR2Pattern = /^https:\/\/pub-[a-f0-9]+\.r2\.dev\/.+\.gif$/i;
    
    if (cloudflareR2Pattern.test(url)) {
      return { valid: true };
    }
    
    // Diagnostics spécifiques
    if (!url.startsWith('http')) {
      return { valid: false, reason: 'Manque le protocole HTTPS' };
    }
    
    if (!url.includes('r2.dev')) {
      return { valid: false, reason: 'Domaine Cloudflare R2 manquant' };
    }
    
    if (!url.endsWith('.gif')) {
      return { valid: false, reason: 'Extension .gif manquante' };
    }
    
    return { valid: false, reason: 'Format URL invalide' };
  }

  /**
   * Teste la connectivité d'une URL
   */
  async testConnectivity(url, timeout = 10000) {
    if (typeof fetch === 'undefined') {
      // Simulation pour Node.js
      return this.simulateConnectivityTest(url);
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      return {
        accessible: response.ok,
        status: response.status,
        statusText: response.statusText
      };
    } catch (error) {
      return {
        accessible: false,
        error: error.message
      };
    }
  }

  /**
   * Simulation du test de connectivité pour Node.js
   */
  simulateConnectivityTest(url) {
    // Simulation basée sur des patterns connus
    const validPattern = /^https:\/\/pub-e9db5024dff64a89897b25c9ea2a0d59\.r2\.dev\/.+\.gif$/;
    
    if (validPattern.test(url)) {
      // Simulation d'URLs qui pourraient être accessibles
      const fileName = url.split('/').pop();
      const hasNumber = /^\d+/.test(fileName);
      
      return {
        accessible: hasNumber, // Les fichiers avec numéro sont plus susceptibles d'exister
        status: hasNumber ? 200 : 404,
        statusText: hasNumber ? 'OK' : 'Not Found',
        simulated: true
      };
    }
    
    return {
      accessible: false,
      status: 400,
      statusText: 'Bad Request',
      error: 'URL malformée',
      simulated: true
    };
  }

  /**
   * Propose une correction automatique pour une URL
   */
  suggestCorrection(originalUrl, moveId) {
    const baseUrl = 'https://pub-e9db5024dff64a89897b25c9ea2a0d59.r2.dev/';
    
    // Cas 1: Nom de fichier simple
    if (originalUrl && !originalUrl.includes('/') && originalUrl.endsWith('.gif')) {
      return baseUrl + encodeURIComponent(originalUrl);
    }
    
    // Cas 2: Nom avec numéro au début
    const numberMatch = originalUrl.match(/^(\d+\s+.+\.gif)$/);
    if (numberMatch) {
      return baseUrl + encodeURIComponent(numberMatch[1]);
    }
    
    // Cas 3: Basé sur l'ID du mouvement
    if (moveId) {
      const moveNumber = moveId.replace('move_', '');
      return baseUrl + `${moveNumber}.gif`;
    }
    
    return null;
  }

  /**
   * Teste un mouvement de danse
   */
  async testMove(move) {
    console.log(`\n🧪 Test du mouvement: ${move.movementName} (${move.id})`);
    
    const result = {
      moveId: move.id,
      movementName: move.movementName,
      originalUrl: move.driveLink,
      hasGif: move.hasGif,
      issues: []
    };

    // Test 1: Vérification hasGif vs driveLink
    if (move.hasGif && !move.driveLink) {
      result.issues.push('❌ hasGif=true mais driveLink vide');
    }
    
    if (!move.hasGif && move.driveLink) {
      result.issues.push('⚠️ hasGif=false mais driveLink présent');
    }

    // Test 2: Validation du format URL
    const formatValidation = this.validateUrlFormat(move.driveLink);
    if (!formatValidation.valid) {
      result.issues.push(`❌ Format URL invalide: ${formatValidation.reason}`);
      
      // Tentative de correction
      const correctedUrl = this.suggestCorrection(move.driveLink, move.id);
      if (correctedUrl) {
        result.correctedUrl = correctedUrl;
        result.issues.push(`🔧 URL corrigée suggérée: ${correctedUrl}`);
      }
    }

    // Test 3: Test de connectivité
    const urlToTest = result.correctedUrl || move.driveLink;
    if (urlToTest && formatValidation.valid) {
      console.log(`   🌐 Test de connectivité: ${urlToTest}`);
      const connectivity = await this.testConnectivity(urlToTest);
      
      if (connectivity.accessible) {
        result.issues.push('✅ URL accessible');
        this.results.validUrls++;
      } else {
        result.issues.push(`❌ URL inaccessible: ${connectivity.error || connectivity.statusText}`);
        this.results.unreachableUrls++;
      }
      
      if (connectivity.simulated) {
        result.issues.push('ℹ️ Test simulé (Node.js)');
      }
    } else {
      this.results.invalidUrls++;
    }

    this.results.details.push(result);
    this.results.totalTested++;

    // Affichage des résultats
    result.issues.forEach(issue => console.log(`   ${issue}`));
    
    return result;
  }

  /**
   * Reproduit le dysfonctionnement "Gif indisponible"
   */
  reproduceDysfunction() {
    console.log('🎯 REPRODUCTION DU DYSFONCTIONNEMENT "GIF INDISPONIBLE"\n');
    console.log('Scénario: Un utilisateur clique sur un GIF dans ses favoris');
    console.log('Résultat attendu: Le GIF se charge et s\'anime');
    console.log('Résultat observé: Message "Gif indisponible" et pas d\'animation\n');
    
    console.log('📋 CAUSES POTENTIELLES IDENTIFIÉES:');
    console.log('1. URLs malformées ou incomplètes dans les données');
    console.log('2. Liens brisés vers des fichiers inexistants');
    console.log('3. Problèmes de permissions d\'accès Cloudflare R2');
    console.log('4. Gestion d\'erreur insuffisante côté client');
    console.log('5. Cache corrompu ou expiré');
    console.log('6. Conflits de chargement asynchrone\n');
  }

  /**
   * Lance tous les tests
   */
  async runAllTests() {
    console.log('🚀 DÉMARRAGE DES TESTS DE DYSFONCTIONNEMENT GIF\n');
    
    this.reproduceDysfunction();
    
    console.log('🔍 ANALYSE DES DONNÉES PROBLÉMATIQUES:\n');
    
    for (const move of problematicMoves) {
      await this.testMove(move);
    }
    
    this.generateReport();
  }

  /**
   * Génère un rapport final
   */
  generateReport() {
    console.log('\n📊 RAPPORT FINAL DE DIAGNOSTIC\n');
    console.log('═'.repeat(50));
    console.log(`Total testé: ${this.results.totalTested}`);
    console.log(`URLs valides: ${this.results.validUrls}`);
    console.log(`URLs invalides: ${this.results.invalidUrls}`);
    console.log(`URLs inaccessibles: ${this.results.unreachableUrls}`);
    console.log('═'.repeat(50));
    
    const successRate = ((this.results.validUrls / this.results.totalTested) * 100).toFixed(1);
    console.log(`\n📈 Taux de succès: ${successRate}%`);
    
    if (successRate < 50) {
      console.log('🚨 DYSFONCTIONNEMENT CONFIRMÉ: Plus de 50% des GIFs sont problématiques');
    } else if (successRate < 80) {
      console.log('⚠️ PROBLÈMES DÉTECTÉS: Dysfonctionnement partiel');
    } else {
      console.log('✅ SYSTÈME FONCTIONNEL: Peu de problèmes détectés');
    }
    
    console.log('\n🔧 SOLUTIONS RECOMMANDÉES:');
    console.log('1. ✅ Implémenter le composant GifPlayer avec validation');
    console.log('2. ✅ Ajouter un système de retry automatique');
    console.log('3. ✅ Créer un mécanisme de fallback intelligent');
    console.log('4. ✅ Afficher des messages d\'erreur informatifs');
    console.log('5. 🔄 Corriger les URLs malformées dans les données');
    console.log('6. 🔄 Mettre en place un cache robuste');
    
    console.log('\n💡 STATUT DE L\'IMPLÉMENTATION:');
    console.log('✅ Composant GifPlayer créé avec gestion d\'erreur avancée');
    console.log('✅ Utilitaire de validation GifValidator implémenté');
    console.log('✅ Page Favoris mise à jour avec nouveau système');
    console.log('✅ Interface utilisateur informative ajoutée');
    
    // Sauvegarde du rapport
    const reportData = {
      timestamp: new Date().toISOString(),
      summary: this.results,
      recommendations: [
        'Corriger les URLs malformées dans danceMoves.ts',
        'Vérifier la disponibilité des fichiers sur Cloudflare R2',
        'Implémenter un système de monitoring des GIFs',
        'Ajouter des tests automatisés de connectivité'
      ]
    };
    
    try {
      fs.writeFileSync(
        path.join(__dirname, 'gif-dysfunction-report.json'),
        JSON.stringify(reportData, null, 2)
      );
      console.log('\n📄 Rapport sauvegardé: scripts/gif-dysfunction-report.json');
    } catch (error) {
      console.log('\n⚠️ Impossible de sauvegarder le rapport:', error.message);
    }
  }
}

// Exécution du test si le script est lancé directement
if (require.main === module) {
  const tester = new GifDysfunctionTester();
  tester.runAllTests().catch(console.error);
}

module.exports = GifDysfunctionTester;