import { app } from '../utils/firebase';
import { FieldValue } from '@firebase/firestore-types';
import {
  doc,
  DocumentData,
  DocumentReference,
  getDoc,
  getFirestore,
  QueryDocumentSnapshot,
  serverTimestamp,
  setDoc,
  SetOptions,
  SnapshotOptions,
} from 'firebase/firestore';
import { Group } from './group';

const Db = getFirestore(app);

export type User = {
  name: string;
  group?: DocumentReference<Group>[];
  updated: FieldValue;
};

const userDataConverter = {
  toFirestore(user: User): DocumentData {
    const data: User = user;
    user.updated = serverTimestamp();
    return data;
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
    option: SnapshotOptions
  ): User {
    const data = snapshot.data(option);
    return {
      name: data.name,
      updated: data.updated,
      group: data.group ?? [],
    };
  },
};

async function setUser(
  user: Partial<User>,
  id: string,
  option?: SetOptions
): Promise<void> {
  try {
    return await setDoc(
      doc(Db, `user/${id}`).withConverter(userDataConverter),
      user,
      option ?? {}
    );
  } catch (error) {
    console.error(error);
    throw new Error(`Invalid data: ${error}`);
  }
}

const getUser = async (id: string): Promise<Readonly<User> | null> => {
  try {
    const data = await getDoc(
      doc(Db, `user/${id}`).withConverter(userDataConverter)
    );
    return data.data() ?? null;
  } catch (error) {
    console.error(error);
    throw new Error();
  }
};
export { setUser, getUser };
