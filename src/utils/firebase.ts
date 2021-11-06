import {
  CACHE_SIZE_UNLIMITED,
  Firestore,
  getFirestore,
  initializeFirestore,
} from '@firebase/firestore';
import { initializeApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: `${import.meta.env.VITE_FIREBASE_API_KEY}`,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  databaseURL: `https://${
    import.meta.env.VITE_FIREBASE_PROJECT_ID
  }.firebaseio.com`,
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

export const Db = (): Firestore => {
  if (hasInitialized) return getFirestore(app);
  else {
    hasInitialized = true;
    return initializeFirestore(app, {
      cacheSizeBytes: CACHE_SIZE_UNLIMITED,
    });
  }
};

export { app };
