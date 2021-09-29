import { doc, FirestoreDataConverter, setDoc } from '@firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import { app } from './firebase';

const Db = getFirestore(app);

class Invite {
  constructor(
    readonly created: Date,
    readonly memberId: string,
    readonly authorId: string
  ) {}
}

const inviteConverter: FirestoreDataConverter<Invite> = {
  toFirestore(data: Invite) {
    return {
      created: data.created,
      memberId: data.memberId,
      authorId: data.authorId,
    };
  },
  fromFirestore(snapshot, query) {
    const data = snapshot.data(query);
    return new Invite(data.created, data.memberId, data.authorId);
  },
};

export async function createInvite(
  mail: string,
  invite: Invite,
  groupId: string
): Promise<void> {
  try {
    return await setDoc(
      doc(Db, `group/${groupId}/invite/${mail}`).withConverter(inviteConverter),
      invite
    );
  } catch (error) {
    console.error(error);
    throw new Error();
  }
}
