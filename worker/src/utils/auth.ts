import { JWTPayload, User } from '../types';

/**
 * Hache un mot de passe avec Web Crypto API
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  
  // Générer un salt aléatoire
  const salt = crypto.getRandomValues(new Uint8Array(16));
  
  // Importer la clé pour PBKDF2
  const key = await crypto.subtle.importKey(
    'raw',
    data,
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  
  // Dériver la clé avec PBKDF2
  const derivedKey = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    key,
    256
  );
  
  // Combiner salt et hash
  const hashArray = new Uint8Array(derivedKey);
  const combined = new Uint8Array(salt.length + hashArray.length);
  combined.set(salt);
  combined.set(hashArray, salt.length);
  
  // Encoder en base64
  return btoa(String.fromCharCode(...combined));
}

/**
 * Vérifie un mot de passe contre son hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    
    // Décoder le hash
    const combined = new Uint8Array(
      atob(hash).split('').map(char => char.charCodeAt(0))
    );
    
    // Extraire le salt et le hash
    const salt = combined.slice(0, 16);
    const storedHash = combined.slice(16);
    
    // Importer la clé pour PBKDF2
    const key = await crypto.subtle.importKey(
      'raw',
      data,
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );
    
    // Dériver la clé avec le même salt
    const derivedKey = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      key,
      256
    );
    
    const newHash = new Uint8Array(derivedKey);
    
    // Comparer les hash
    if (newHash.length !== storedHash.length) return false;
    
    let result = 0;
    for (let i = 0; i < newHash.length; i++) {
      result |= newHash[i] ^ storedHash[i];
    }
    
    return result === 0;
  } catch (error) {
    console.error('Erreur vérification mot de passe:', error);
    return false;
  }
}

/**
 * Génère un token JWT d'accès avec Web Crypto API
 */
export async function generateAccessToken(user: User, secret: string): Promise<string> {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };
  
  const now = Math.floor(Date.now() / 1000);
  const payload: JWTPayload = {
    user_id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    iat: now,
    exp: now + (60 * 60) // 1 heure
  };
  
  return await createJWT(header, payload, secret);
}

/**
 * Génère un token JWT de rafraîchissement
 */
export async function generateRefreshToken(user: User, secret: string): Promise<string> {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };
  
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    user_id: user.id,
    type: 'refresh',
    iat: now,
    exp: now + (7 * 24 * 60 * 60) // 7 jours
  };
  
  return await createJWT(header, payload, secret);
}

/**
 * Vérifie et décode un token JWT
 */
export async function verifyToken(token: string, secret: string): Promise<JWTPayload> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Format de token invalide');
    }
    
    const [headerB64, payloadB64, signatureB64] = parts;
    
    // Vérifier la signature
    const data = `${headerB64}.${payloadB64}`;
    const expectedSignature = await signData(data, secret);
    
    if (signatureB64 !== expectedSignature) {
      throw new Error('Signature invalide');
    }
    
    // Décoder le payload
    const payloadJson = atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/'));
    const payload = JSON.parse(payloadJson) as JWTPayload;
    
    // Vérifier l'expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      throw new Error('Token expiré');
    }
    
    return payload;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Erreur de vérification du token: ${error.message}`);
    }
    throw new Error('Erreur de vérification du token');
  }
}

/**
 * Crée un JWT avec Web Crypto API
 */
async function createJWT(header: any, payload: any, secret: string): Promise<string> {
  const headerB64 = base64UrlEncode(JSON.stringify(header));
  const payloadB64 = base64UrlEncode(JSON.stringify(payload));
  
  const data = `${headerB64}.${payloadB64}`;
  const signature = await signData(data, secret);
  
  return `${data}.${signature}`;
}

/**
 * Signe des données avec HMAC-SHA256
 */
async function signData(data: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(data);
  
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', key, messageData);
  return base64UrlEncode(new Uint8Array(signature));
}

/**
 * Encode en base64 URL-safe
 */
function base64UrlEncode(data: string | Uint8Array): string {
  let base64: string;
  
  if (typeof data === 'string') {
    base64 = btoa(data);
  } else {
    base64 = btoa(String.fromCharCode(...data));
  }
  
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Génère un token de partage sécurisé
 */
export function generateShareToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Valide la force d'un mot de passe
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
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
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Génère un ID unique
 */
export function generateId(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Valide un email
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Valide un nom d'utilisateur
 */
export function validateUsername(username: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (username.length < 3) {
    errors.push('Le nom d\'utilisateur doit contenir au moins 3 caractères');
  }
  
  if (username.length > 30) {
    errors.push('Le nom d\'utilisateur ne peut pas dépasser 30 caractères');
  }
  
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    errors.push('Le nom d\'utilisateur ne peut contenir que des lettres, chiffres, tirets et underscores');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}