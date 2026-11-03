// Recursos do app Android (Capacitor). No navegador, isNative é false e nada disto é usado.
import { Capacitor, registerPlugin } from '@capacitor/core';
import type { BackgroundGeolocationPlugin } from '@capacitor-community/background-geolocation';

export const isNative = Capacitor.isNativePlatform();
export const BackgroundGeolocation = registerPlugin<BackgroundGeolocationPlugin>('BackgroundGeolocation');

/** Link do APK publicado junto com o site */
export const APK_URL = '/eurotrip-2026.apk';
export const isAndroidBrowser = !isNative && /android/i.test(navigator.userAgent);
