import firebase from 'firebase/app';
import 'firebase/analytics';
import 'firebase/auth';
import 'firebase/firestore';

const firebaseConfig = {
  apiKey: `${process.env.REACT_APP_FIREBASE_API_KEY}`,
  authDomain: `${process.env.REACT_APP_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  databaseURL: `https://${process.env.REACT_APP_FIREBASE_PROJECT_ID}.firebaseio.com`,
  projectId: `${process.env.REACT_APP_FIREBASE_PROJECT_ID}`,
  storageBucket: `${process.env.REACT_APP_FIREBASE_PROJECT_ID}.appspot.com`,
  appId: `${process.env.REACT_APP_FIREBASE_APP_ID}`,
  measurementId: `G-${process.env.REACT_APP_FIREBASE_MEASUREMENT_ID}`,
};

let app: firebase.app.App;

if (firebase.app.length) {
  app = firebase.initializeApp(firebaseConfig);
  console.info(firebaseConfig);
}

export type dataWithId<T> = {
  id: string;
  data: T;
};

const Auth = firebase.auth();
const Db = firebase.firestore();
export { Auth, firebase, Db, app };
