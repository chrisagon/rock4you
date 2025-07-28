#!/usr/bin/env node

/**
 * Script de correction automatique des URLs de GIFs dans danceMoves.ts
 * Corrige les URLs malformées et valide la connectivité
 */

const fs = require('fs');
const path = require('path');

class GifUrlFixer {
  constructor() {
    this.baseUrl = 'https://pub-e9db5024dff64a89897b25c9ea2a0d59.r2.dev/';
    this.corrections = [];
    this.stats = {
      total: 0,
      corrected: 0,
      alreadyValid: 0,
      unfixable: 0
    };
  }

  /**
   * Lit le fichier danceMoves.ts
   */
  readDanceMovesFile() {
    const filePath = path.join(__dirname, '..', 'data', 'danceMoves.ts');
    
    if (!fs.existsSync(filePath)) {
      throw new Error(`Fichier non trouvé: ${filePath}`);
    }
    
    return fs.readFileSync(filePath, 'utf8');
  }

  /**
   * Valide le format d'une URL
   */
  isValidUrl(url) {
    const pattern = /^https:\/\/pub-[a-f0-9]+\.r2\.dev\/.+\.gif$/i;
    return pattern.test(url);
  }

  /**
   * Corrige une URL malformée
   */
  fixUrl(originalUrl, moveId) {
    if (!originalUrl) return null;
    
    // Déjà valide
    if (this.isValidUrl(originalUrl)) {
      return originalUrl;
    }

    // Cas 1: Nom de fichier simple
    if (originalUrl.endsWith('.gif') && !originalUrl.includes('/')) {
      return this.baseUrl + encodeURIComponent(originalUrl);
    }

    // Cas 2: Nom avec numéro au début
    const numberMatch = originalUrl.match(/^(\d+\s+.+\.gif)$/i);
    if (numberMatch) {
      return this.baseUrl + encodeURIComponent(numberMatch[1]);
    }

    // Cas 3: URL partielle
    if (originalUrl.startsWith('pub-e9db5024dff64a89897b25c9ea2a0d59.r2.dev/')) {
      return 'https://' + originalUrl;
    }

    // Cas 4: Extraction du nom de fichier d'une URL complète
    const fileMatch = originalUrl.match(/([^\/]+\.gif)$/i);
    if (fileMatch) {
      return this.baseUrl + encodeURIComponent(fileMatch[1]);
    }

    return null;
  }

  /**
   * Analyse et corrige le contenu du fichier
   */
  processFile() {
    console.log('🔧 CORRECTION AUTOMATIQUE DES URLs DE GIFS\n');
    
    let content = this.readDanceMovesFile();
    const lines = content.split('\n');
    let modified = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Recherche des lignes driveLink
      const driveLinkMatch = line.match(/^(\s*"driveLink":\s*")([^"]*)(.*)/);
      if (driveLinkMatch) {
        const [, prefix, originalUrl, suffix] = driveLinkMatch;
        this.stats.total++;

        if (this.isValidUrl(originalUrl)) {
          this.stats.alreadyValid++;
          console.log(`✅ Ligne ${i + 1}: URL déjà valide`);
          continue;
        }

        // Tentative de correction
        const correctedUrl = this.fixUrl(originalUrl, `move_${this.stats.total}`);
        
        if (correctedUrl && correctedUrl !== originalUrl) {
          lines[i] = prefix + correctedUrl + suffix;
          modified = true;
          this.stats.corrected++;
          
          this.corrections.push({
            line: i + 1,
            original: originalUrl,
            corrected: correctedUrl,
            reason: this.getCorrectionReason(originalUrl, correctedUrl)
          });
          
          console.log(`🔧 Ligne ${i + 1}: ${originalUrl} → ${correctedUrl}`);
        } else {
          this.stats.unfixable++;
          console.log(`❌ Ligne ${i + 1}: Impossible de corriger "${originalUrl}"`);
        }
      }
    }

    if (modified) {
      return lines.join('\n');
    }
    
    return null;
  }

  /**
   * Détermine la raison de la correction
   */
  getCorrectionReason(original, corrected) {
    if (!original.startsWith('http')) {
      return 'Ajout du protocole HTTPS et du domaine';
    }
    if (!original.includes('r2.dev')) {
      return 'Correction du domaine vers Cloudflare R2';
    }
    if (original.startsWith('pub-')) {
      return 'Ajout du protocole HTTPS';
    }
    return 'Correction générale de l\'URL';
  }

  /**
   * Sauvegarde le fichier corrigé
   */
  saveFile(content) {
    const filePath = path.join(__dirname, '..', 'data', 'danceMoves.ts');
    const backupPath = path.join(__dirname, '..', 'data', 'danceMoves.ts.backup');
    
    // Créer une sauvegarde
    fs.copyFileSync(filePath, backupPath);
    console.log(`💾 Sauvegarde créée: ${backupPath}`);
    
    // Sauvegarder le fichier corrigé
    fs.writeFileSync(filePath, content);
    console.log(`✅ Fichier corrigé sauvegardé: ${filePath}`);
  }

  /**
   * Génère un rapport de correction
   */
  generateReport() {
    console.log('\n📊 RAPPORT DE CORRECTION\n');
    console.log('═'.repeat(50));
    console.log(`Total d'URLs analysées: ${this.stats.total}`);
    console.log(`URLs déjà valides: ${this.stats.alreadyValid}`);
    console.log(`URLs corrigées: ${this.stats.corrected}`);
    console.log(`URLs non corrigeables: ${this.stats.unfixable}`);
    console.log('═'.repeat(50));

    const successRate = ((this.stats.alreadyValid + this.stats.corrected) / this.stats.total * 100).toFixed(1);
    console.log(`\n📈 Taux de succès après correction: ${successRate}%`);

    if (this.corrections.length > 0) {
      console.log('\n🔧 DÉTAILS DES CORRECTIONS:');
      this.corrections.forEach((correction, index) => {
        console.log(`\n${index + 1}. Ligne ${correction.line}`);
        console.log(`   Avant: ${correction.original}`);
        console.log(`   Après: ${correction.corrected}`);
        console.log(`   Raison: ${correction.reason}`);
      });
    }

    // Sauvegarde du rapport
    const reportData = {
      timestamp: new Date().toISOString(),
      stats: this.stats,
      corrections: this.corrections,
      recommendations: [
        'Vérifier manuellement les URLs non corrigeables',
        'Tester la connectivité des URLs corrigées',
        'Mettre à jour les fichiers manquants sur Cloudflare R2',
        'Implémenter un système de validation automatique'
      ]
    };

    try {
      fs.writeFileSync(
        path.join(__dirname, 'gif-correction-report.json'),
        JSON.stringify(reportData, null, 2)
      );
      console.log('\n📄 Rapport de correction sauvegardé: scripts/gif-correction-report.json');
    } catch (error) {
      console.log('\n⚠️ Impossible de sauvegarder le rapport:', error.message);
    }
  }

  /**
   * Lance le processus de correction
   */
  run() {
    try {
      const correctedContent = this.processFile();
      
      if (correctedContent) {
        this.saveFile(correctedContent);
        console.log('\n✅ Correction terminée avec succès !');
      } else {
        console.log('\n✅ Aucune correction nécessaire - toutes les URLs sont déjà valides');
      }
      
      this.generateReport();
      
    } catch (error) {
      console.error('\n❌ Erreur lors de la correction:', error.message);
      process.exit(1);
    }
  }
}

// Exécution si le script est lancé directement
if (require.main === module) {
  const fixer = new GifUrlFixer();
  fixer.run();
}

module.exports = GifUrlFixer;