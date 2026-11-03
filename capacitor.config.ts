import type { CapacitorConfig } from '@capacitor/cli';

// O app Android carrega o site publicado: toda atualização na Vercel chega sem reinstalar o APK.
const config: CapacitorConfig = {
  appId: 'app.eurotrip2026',
  appName: 'Eurotrip 2026',
  webDir: 'dist',
  server: {
    url: 'https://eurotrip2026-rouge.vercel.app',
    androidScheme: 'https',
  },
  android: { allowMixedContent: false },
};

export default config;
