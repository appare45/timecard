import { app, firebase } from '../utils/firebase';
import { FieldValue } from '@firebase/firestore-types';
import {
  doc,
  DocumentData,
  getDoc,
  getFirestore,
  QueryDocumentSnapshot,
  setDoc,
  SnapshotOptions,
} from 'firebase/firestore';

const Db = getFirestore(app);

export type User = {
  name: string;
  groupId?: string[];
  updated: FieldValue;
};

// Type guard
const isUser = (item: {
  name?: unknown;
  updated?: unknown;
  groupId?: unknown[];
}): item is User => {
  if (!(item.name && typeof item.name == 'string' && item.name.length > 0)) {
    return false;
  }
  if (!item.updated) {
    return false;
  }
  if (
    !(
      (item?.groupId &&
        Array.isArray(item.groupId) &&
        item.groupId.some((v) => typeof v === 'string')) ||
      item?.groupId?.length == 0
    )
  ) {
    return false;
  }
  return true;
};

const userDataConverter = {
  toFirestore(user: User): DocumentData {
    const data: User = user;
    user.updated = firebase.firestore.FieldValue.serverTimestamp();
    return data;
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
    option: SnapshotOptions
  ): User {
    const data = snapshot.data(option);
    if (!isUser(data)) {
      throw new Error('Invalid user data');
    }
    return {
      name: data.name,
      updated: data.updated,
      groupId: data.groupId ?? [],
    };
  },
};

async function setUser(
  user: Partial<User>,
  id: string,
  option?: firebase.firestore.SetOptions
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
