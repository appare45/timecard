import { getFirestore } from '@firebase/firestore';
import { initializeApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: `${process.env.REACT_APP_FIREBASE_API_KEY}`,
  authDomain: `${process.env.REACT_APP_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  databaseURL: `https://${process.env.REACT_APP_FIREBASE_PROJECT_ID}.firebaseio.com`,
  projectId: `${process.env.REACT_APP_FIREBASE_PROJECT_ID}`,
  storageBucket: `${process.env.REACT_APP_FIREBASE_PROJECT_ID}.appspot.com`,
  appId: `${process.env.REACT_APP_FIREBASE_APP_ID}`,
  measurementId: `G-${process.env.REACT_APP_FIREBASE_MEASUREMENT_ID}`,
};

const app = initializeApp(firebaseConfig);

export type dataWithId<T> = {
  id: string;
  data: T;
};

export const Db = getFirestore(app);

export { app };
