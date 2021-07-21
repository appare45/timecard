import { Db } from './firebase';
import { firebase } from '../utils/firebase';
import { Timestamp } from '@firebase/firestore-types';

type User = {
  name: string;
  groupId?: [string];
  updated?: Timestamp;
};

// Type guard
const isUser = (item: {
  name?: unknown;
  updated?: unknown;
  groupId?: unknown[];
}): item is User => {
  if (!(item.name && typeof item.name == 'string')) {
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
      !item?.groupId
    )
  ) {
    return false;
  }
  return true;
};

const userDataConverter = {
  toFirestore(user: User): firebase.firestore.DocumentData {
    return {
      name: user.name,
      groupId: user?.groupId ?? [],
      updated: firebase.firestore.FieldValue.serverTimestamp(),
    };
  },
  fromFirestore(
    snapshot: firebase.firestore.QueryDocumentSnapshot,
    option: firebase.firestore.SnapshotOptions
  ): User {
    const data = snapshot.data(option);
    if (!isUser(data)) {
      console.error('ユーザーデータ取得中にエラーが発生しました');
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
    console.error(error);
    throw new Error(`Invalid data: ${error}`);
  }
}

const getUser = async (id: string): Promise<Readonly<User> | null> => {
  try {
    const data = await Db.collection('user')
      .withConverter(userDataConverter)
      .doc(id)
      .get();
    return data.data() ?? null;
  } catch (error) {
    console.error(error);
    throw new Error('Invalid data');
  }
};

export { setUser, getUser };
