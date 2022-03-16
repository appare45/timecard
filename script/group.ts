import admin, { initializeApp } from 'firebase-admin';
import { databaseURL } from '../src/utils/firebase';

const Initilize = async () => {
  const serviceAccount = import('../serviceAccountKey.json');
  admin.initializeApp({
    credential: admin.credential.cert(
      (await serviceAccount) as admin.ServiceAccount
    ),
    databaseURL: databaseURL,
  });
};
