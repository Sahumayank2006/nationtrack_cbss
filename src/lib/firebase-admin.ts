import 'server-only';

import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;

const hasServiceAccountCreds = Boolean(projectId && clientEmail && privateKey);
export const isFirebaseAdminConfigured = Boolean(
  hasServiceAccountCreds || process.env.GOOGLE_APPLICATION_CREDENTIALS
);

function getOrInitAdminApp() {
  const existing = getApps()[0];
  if (existing) return existing;

  if (hasServiceAccountCreds) {
    return initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
      storageBucket,
    });
  }

  // Allows usage in environments with GOOGLE_APPLICATION_CREDENTIALS set.
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return initializeApp({
      credential: applicationDefault(),
      projectId,
      storageBucket,
    });
  }

  return undefined;
}

const adminConfigError =
  'Firebase Admin is not configured. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY.';

export function getAdminDb() {
  const adminApp = getOrInitAdminApp();
  if (!adminApp) throw new Error(adminConfigError);
  return getFirestore(adminApp);
}

export function getAdminAuth() {
  const adminApp = getOrInitAdminApp();
  if (!adminApp) throw new Error(adminConfigError);
  return getAuth(adminApp);
}

export function getAdminStorage() {
  const adminApp = getOrInitAdminApp();
  if (!adminApp) throw new Error(adminConfigError);
  return getStorage(adminApp);
}
