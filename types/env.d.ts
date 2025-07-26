declare global {
  namespace NodeJS {
    interface ProcessEnv {
      EXPO_PUBLIC_CLOUDFLARE_R2_BUCKET_NAME: string;
      EXPO_PUBLIC_CLOUDFLARE_R2_ACCOUNT_ID: string;
      EXPO_PUBLIC_CLOUDFLARE_R2_DOMAIN: string;
      EXPO_PUBLIC_CLOUDFLARE_R2_CUSTOM_DOMAIN?: string;
    }
  }
}

// Ensure this file is treated as a module
export {};