import {
  doc,
  DocumentData,
  DocumentSnapshot,
  FirestoreDataConverter,
  getDoc,
  QueryDocumentSnapshot,
  setDoc,
  SnapshotOptions,
} from '@firebase/firestore';
import { Db } from './firebase';

export type Invite = {
  authorId: string;
  groupId: string;
};

const inviteDataConverter: FirestoreDataConverter<Invite> = {
  toFirestore(invite: Invite): DocumentData {
    return invite;
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
    option: SnapshotOptions
  ): Invite {
    const data = snapshot.data(option);
    return {
      authorId: data.authorId,
      groupId: data.groupId,
    };
  },
};

export const createInvite = async (
  email: string,
  groupId: string,
  code: string
): Promise<void> => {
  try {
    return setDoc(doc(Db(), `invite/${code}`), {
      email: email,
      groupId: groupId,
    });
  } catch (error) {
    console.error(error);
    throw new Error();
  }
};

export const getInvite = async (
  code: string
): Promise<DocumentSnapshot<Invite>> => {
  try {
    return await getDoc(
      doc(Db(), `invite/${code}`).withConverter(inviteDataConverter)
    );
  } catch (error) {
    console.error(error);
    throw new Error();
  }
};
