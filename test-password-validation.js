// Test rapide de validation de mot de passe
console.log('🧪 Test de validation des mots de passe');

const testPasswords = [
  'test123',           // Trop faible (pas de majuscule, pas de caractère spécial)
  'Test123',           // Trop faible (pas de caractère spécial)
  'Test123!',          // Valide
  'password',          // Trop faible (pas de majuscule, pas de chiffre, pas de caractère spécial)
  'PASSWORD123!',      // Valide
];

testPasswords.forEach(password => {
  console.log(`\n📝 Test du mot de passe: "${password}"`);
  
  // Simulation de la validation (comme dans auth.ts)
  const errors = [];
  
  if (password.length < 8) {
    errors.push('Le mot de passe doit contenir au moins 8 caractères');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins une majuscule');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins une minuscule');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins un chiffre');
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins un caractère spécial');
  }
  
  if (errors.length === 0) {
    console.log('✅ Mot de passe valide');
  } else {
    console.log('❌ Mot de passe invalide:');
    errors.forEach(error => console.log(`   • ${error}`));
  }
});

console.log('\n🎯 Exemple de mot de passe valide: "MonMotDePasse123!"');