import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase client initialization (idempotent for Next.js hot reloads)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// In production (e.g., Vercel), missing envs can crash client import.
// Guard initialization so the app still renders instead of a white screen.
// Only require essential config values (messagingSenderId is optional)
const requiredKeys = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'appId'];
const hasRequiredConfig = requiredKeys.every((key) => {
  const value = firebaseConfig[key as keyof typeof firebaseConfig];
  return typeof value === 'string' && value.length > 0;
});

// Debug logging for production troubleshooting
if (typeof window !== 'undefined') {
  console.log('[Firebase] Config check:', {
    hasRequiredConfig,
    configKeys: Object.keys(firebaseConfig).filter(
      (k) => firebaseConfig[k as keyof typeof firebaseConfig]
    ),
    missingKeys: requiredKeys.filter((k) => !firebaseConfig[k as keyof typeof firebaseConfig]),
  });
}

let app: ReturnType<typeof getApp> | undefined;
try {
  app = getApps().length ? getApp() : hasRequiredConfig ? initializeApp(firebaseConfig) : undefined;
  if (typeof window !== 'undefined') {
    console.log('[Firebase] Initialization result:', app ? 'SUCCESS' : 'SKIPPED (missing config)');
  }
} catch (e) {
  // If something goes wrong, avoid throwing during module import in the browser.
  if (typeof window !== 'undefined') {
    console.error('[Firebase] Initialization error:', e);
  }
  app = undefined;
}

export const auth = app ? getAuth(app) : ({} as any);
export const db = app ? getFirestore(app) : ({} as any);
export const storage = app ? getStorage(app) : ({} as any);
export const isFirebaseReady = Boolean(app);
export default app;
