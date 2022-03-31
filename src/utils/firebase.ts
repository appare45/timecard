import {
  CACHE_SIZE_UNLIMITED,
  Firestore,
  getFirestore,
  initializeFirestore,
} from '@firebase/firestore';
import { initializeApp } from 'firebase/app';
import {
  getAnalytics,
  logEvent as analytics_log_event,
} from 'firebase/analytics';
import { connectFirestoreEmulator } from 'firebase/firestore';

export const databaseURL = `https://${
  import.meta.env.VITE_FIREBASE_PROJECT_ID
}.firebaseio.com`;

const firebaseConfig = {
  apiKey: `${import.meta.env.VITE_FIREBASE_API_KEY}`,
  authDomain: `clubroom.appare45.com`,
  databaseURL: databaseURL,
  projectId: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}`,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
  appId: `${import.meta.env.VITE_FIREBASE_APP_ID}`,
  measurementId: `G-${import.meta.env.VITE_FIREBASE_MEASUREMENT_ID}`,
};

const app = initializeApp(firebaseConfig);

export type dataWithId<T> = {
  id: string;
  data: T;
};

let hasInitialized = false;
let isConnectedToEmulator = false;

export const Db = (): Firestore => {
  if (hasInitialized) return getFirestore(app);
  else {
    hasInitialized = true;
    const Db = initializeFirestore(app, {
      cacheSizeBytes: CACHE_SIZE_UNLIMITED,
    });
    if (isEmulator() && !isConnectedToEmulator) {
      isConnectedToEmulator = true;
      connectFirestoreEmulator(Db, '0.0.0.0', 8080);
      console.info('Firestore has connected to emulator');
    }
    return Db;
  }
};

export const analytics = getAnalytics();

export const isEmulator = (): boolean =>
  window.location.hostname == 'localhost' && window.location.port === '8000';

export const isProduction =
  import.meta.env.PROD && !import.meta.env.VITE_PREVIEW && !isEmulator();

export const logEvent = (
  event_name: string,
  params?: { [key: string]: string | number }
): void => {
  if (isProduction) analytics_log_event(analytics, event_name, params);
};

export { app };
