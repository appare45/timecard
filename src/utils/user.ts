import { Db } from './firebase';
import { firebase } from '../utils/firebase';
import { Timestamp } from '@firebase/firestore-types';

type User = {
  readonly name: string;
  readonly updated?: Timestamp;
};

// Type guard
const isUser = (item: { name?: unknown; updated?: unknown }): item is User => {
  if (!(item.name && typeof item.name == 'string')) {
    return false;
  }
  if (!item.updated) {
    return false;
  }
  return true;
};

const userDataConverter = {
  toFirestore(user: User): firebase.firestore.DocumentData {
    return {
      name: user.name,
      updated: firebase.firestore.FieldValue.serverTimestamp(),
    };
  },
  fromFirestore(
    snapshot: firebase.firestore.QueryDocumentSnapshot,
    option: firebase.firestore.SnapshotOptions
  ): User {
    const data = snapshot.data(option);
    if (!isUser(data)) {
      alert('エラーが発生しました');
      return new Error('invalid data');
    }
    return {
      name: data.name,
      updated: data.updated,
    };
  },
};

async function setUser(
  user: User,
  id?: string,
  option?: firebase.firestore.SetOptions
): Promise<void> {
  try {
    return await Db.collection('user')
      .doc(id)
      .withConverter(userDataConverter)
      .set(user, option ?? {});
  } catch (error) {
    throw new Error(`Invalid data: ${error}`);
  }
}

const getUser = async (id: string): Promise<User> => {
  return await Db.collection('user')
    .withConverter(userDataConverter)
    .doc(id)
    .get()
    .then((user) => {
      return user.data();
    })
    .catch((e) => {
      return e;
    });
};

export { setUser, getUser };
